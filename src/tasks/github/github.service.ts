import { Injectable } from '@nestjs/common';
import { task } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { once } from 'lodash';
import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GitHub = require('github-api');

const GITHUB_USER = 'Lucas-Czarnecki';
const GITHUB_REPO = 'COVID-19-CLEANED-JHUCSSE';
const DATA_PATH = 'COVID-19_CLEAN/csse_covid_19_clean_data';

async function climbTree(repo, path, tree) {
  if (!Array.isArray(path)) {
    return climbTree(repo, path.split('/'), tree);
  }

  const { sha } = tree;

  const { data } = await repo.getTree(sha);
  if (!path.length) {
    return data.tree;
  }

  const dir = path.shift();

  const subTree = data.tree.find((t) => t.path === dir);
  if (!subTree) {
    return null;
  }

  return climbTree(repo, path, subTree);
}

const cred = {
  token: process.env.GITHUB_TOKEN,
};

console.log('cred:', cred);

// unauthenticated client

@Injectable()
export class GithubService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  private async addToQueue(type, task, data = {}) {
    this.taskQueue.add({
      ...data,
      type: type.name,
      type_id: type.id,
      task_id: task.id,
    });
  }

  /*  private async prisma.makeTask(typeName, data, parent_task_id = null) {
    const type = await this.prisma.task_type.findFirstOrThrow({
      where: {
        name: typeName,
      },
    });

    const task = await this.prisma.task.create({
      data: {
        task_type_id: type.id,
        data,
        parent_task_id,
      },
    });

    return { type, task };
  }

  async prisma.finishTask(task, status = 'done') {
    await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        completedAt: new Date(),
        status,
      },
    });
  }
*/

  async createPollTask(task: task) {
    try {
      const { type: pollType, task: subtask } = await this.prisma.makeTask(
        'poll github',
        task.id,
      );
      await this.addToQueue(pollType, subtask);
      await this.prisma.finishTask(task);
    } catch (err) {
      const dm = err.response?.data?.message;

      if (dm && typeof dm === 'string' && /API rate limit exceeded/.test(dm)) {
        this.prisma.eventForTask(task.id, 'createPollTask rate limit error');
        const gh = new GitHub(cred);
        gh.getRateLimit().getRateLimit((err, data) => {
          console.log('>>>>>> rate limit:', data);
        });
      } else {
        this.prisma.eventForTask(
          task.id,
          'error in cratePollTask:',
          err.message,
        );
      }
      await this.prisma.finishTask(task, 'error');
    }
  }

  private async getGithubFiles(task, gh) {
    const repo = gh.getRepo(GITHUB_USER, GITHUB_REPO);
    const { data: branch } = await repo.getBranch('master');

    const {
      commit: {
        commit: { tree },
      },
    } = branch;

    try {
      const subTree = await climbTree(repo, DATA_PATH, tree);
      return subTree.filter(
        (t) =>
          typeof t?.path === 'string' &&
          /^CSSE_DailyReports.*csv$/.test(t.path),
      );
    } catch (err) {
      this.prisma.eventForTask(task.id, 'climb tree error: ', err.message);
    }
  }

  async pollGithub(task) {
    const gh = new GitHub(cred);
    try {
      const files = await this.getGithubFiles(task, gh);
      if (Array.isArray(files)) {
        await Promise.all(
          files.map(async (file) => {
            try {
              const { type: processType, task: processTask } =
                await this.prisma.makeTask(
                  'process github file',
                  { ...file },
                  task.id,
                );
              await this.addToQueue(processType, processTask, { file });
            } catch (err) {
              console.log('create file error: ', err);
            }
          }),
        );
        return this.prisma.finishTask(task);
      } else {
        console.log('--- odd files:', files);
      }
    } catch (err) {
      const dm = err.response?.data?.message;
      if (dm && typeof dm === 'string' && /API rate limit exceeded/.test(dm)) {
        console.warn('---- pollGithub error - rate limit');
        gh.getRateLimit().getRateLimit((err, data) => {
          console.log('rate limit:', data);
        });
      } else {
        console.log('--- error in pollGithub:', err);
      }
      return this.prisma.finishTask(err);
    }
  }

  async processFile(task) {
    const { sha, path, size } = task.data;

    const existing = await this.prisma.github_data_files.findFirst({
      where: {
        path,
      },
    });

    if (existing) {
      this.prisma.eventForTask(task.id, 'existing file', existing);
    }

    if (!existing) {
      const newFile = await this.prisma.github_data_files.create({
        data: {
          path,
          sha,
          size,
        },
      });

      const { type: readType, task: readTask } = await this.prisma.makeTask(
        'read csv snapshot',
        {
          file_path: newFile.path,
        },
        task.id,
      );

      await this.addToQueue(readType, readTask, {});
    } else if (existing.size < size) {
      const newFile = await this.prisma.github_data_files.update({
        where: { path },
        data: {
          status: 'created',
          sha,
          size,
        },
      });
      this.prisma.eventForTask(task.id, 'changed sha/size of file', newFile);

      const { type: readType, task: readTask } = await this.prisma.makeTask(
        'read csv snapshot',
        {
          file_path: path,
          lastSize: existing.size,
        },
        task.id,
      );

      await this.addToQueue(readType, readTask, {});
    }
    await this.prisma.finishTask(task);
  }

  async readCsvSnapshot(task) {
    const file = await this.prisma.github_data_files.findFirst({
      where: {
        path: task.data.file_path,
      },
    });

    if (!file) {
      this.prisma.eventForTask(task.id, 'cannot find file for task', task);
      return this.prisma.finishTask(task, 'error');
    }
    if (!['downloaded'].includes(file.status)) {
      //@TODO: process file size change
      this.prisma.eventForTask(
        task.id,
        'file is not downloaded -- leaving alone',
        {
          task,
          file,
        },
      );
      return this.prisma.finishTask(task, 'done');
    }

    /*  const gh = new GitHub(cred);
    const repo = gh.getRepo(GITHUB_USER, GITHUB_REPO);*/
    /*    const octokit = new Octokit ({
      auth: process.env.GITHUB_TOKEN,
    });*/

    try {
      this.prisma.eventForTask(
        task.id,
        `getting blob of ${file.path} / ${file.sha}`,
      );

      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/blobs/${file.sha}`;
      console.log('getting content for file', file, 'from', url);
      const result = await axios.get(url);
      const { content } = result.data;
      console.log('content gotten for file', file);

      this.prisma.eventForTask(
        task.id,
        `blob content returned from  ${file.path} / ${file.sha}`,
        {
          stringLength: typeof content === 'string' ? content.length : '?',
        },
      );

      if (!(typeof content === 'string' && content.length)) {
        throw new Error('bad content returned from api');
      }

      await this.writeGithubFile(task, file, content);
    } catch (err) {
      this.prisma.eventForTask(task.id, 'error reading blob', err.message``);
      this.prisma.finishTask(task, 'error');
    }
  }

  async writeGithubFile(task, file, content) {
    const contentString = new Buffer(content, 'base64').toString();

    const csvPath = path.resolve(
      __dirname,
      `../../../../data_files/${file.path}`,
    );
    await this.prisma.eventForTask(task.id, 'writing to file', {
      path: csvPath,
    });
    fs.writeFile(csvPath, contentString, async (fileErr) => {
      try {
        if (fileErr) {
          await this.prisma.finishTask(task, 'error');
          this.prisma.eventForTask(task.id, 'file write error: ', {
            message: fileErr.message,
            path: csvPath,
          });
          await this.prisma.github_data_files.update({
            where: {
              path: file.path,
            },
            data: {
              status: 'error writing',
            },
          });
        } else {
          this.prisma.eventForTask(task.id, 'file written', {
            path: csvPath,
          });
          await this.prisma.github_data_files.update({
            where: {
              path: file.path,
            },
            data: {
              status: 'downloaded',
            },
          });
          await this.prisma.finishTask(task);
          const { task: writeTask, type } = await this.prisma.makeTask(
            'write csv records',
            {
              filePath: file.path,
              sha: file.sha,
            },
            task.id,
          );
          return this.addToQueue(type, writeTask, file);
        }
      } catch (err) {
        await this.prisma.eventForTask(task.id, 'error writing file', {
          message: err.message,
        });
        this.prisma.finishTask(task, 'error');
      }
    });
  }
}
