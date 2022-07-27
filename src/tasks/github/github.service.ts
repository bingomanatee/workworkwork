import { Injectable } from '@nestjs/common';
import { task } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
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
    private prismaService: PrismaService,
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

  async createPollTask(task: task) {
    try {
      const { type: pollType, task: subtask } =
        await this.prismaService.makeTask('poll github', task.id);
      await this.addToQueue(pollType, subtask);
      await this.prismaService.finishTask(task);
    } catch (err) {
      const dm = err.response?.data?.message;

      if (dm && typeof dm === 'string' && /API rate limit exceeded/.test(dm)) {
        await this.prismaService.eventForTask(
          task.id,
          'createPollTask rate limit error',
        );
        const gh = new GitHub(cred);
        gh.getRateLimit().getRateLimit((err, data) => {
          console.log('>>>>>> rate limit:', data);
        });
      } else {
        await this.prismaService.eventForTask(
          task.id,
          'error in cratePollTask:',
          err.message,
        );
      }
      await this.prismaService.finishTask(task, 'error');
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
      await this.prismaService.eventForTask(
        task.id,
        'climb tree error: ',
        err.message,
      );
    }
  }

  async pollGithub(task) {
    const gh = new GitHub(cred);
    try {
      const files = await this.getGithubFiles(task, gh);
      if (Array.isArray(files)) {
        for (let i = 0; i < files.length; ++i) {
          const file = files[i];
          try {
            const { type: processType, task: processTask } =
              await this.prismaService.makeTask(
                'process github file',
                { ...file },
                task.id,
              );
            await this.addToQueue(processType, processTask, { file });
          } catch (err) {
            console.log('create file error: ', err);
          }
        }
        return this.prismaService.finishTask(task);
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
      return this.prismaService.finishTask(task, err.message);
    }
  }

  async processFile(task) {
    const { sha, path, size } = task.data;

    const existing =
      await this.prismaService.prisma.github_data_files.findFirst({
        where: {
          path,
        },
      });

    if (existing) {
      await this.prismaService.eventForTask(task.id, 'existing file', existing);
    }

    if (!existing) {
      const newFile = await this.prismaService.prisma.github_data_files.create({
        data: {
          path,
          sha,
          size,
        },
      });

      const { type: readType, task: readTask } =
        await this.prismaService.makeTask(
          'read csv snapshot',
          {
            file_path: newFile.path,
          },
          task.id,
        );

      await this.addToQueue(readType, readTask, {});
    } else if (existing.size < size) {
      const newFile = await this.prismaService.prisma.github_data_files.update({
        where: { path },
        data: {
          status: 'created',
          sha,
          size,
        },
      });
      await this.prismaService.eventForTask(
        task.id,
        'changed sha/size of file',
        newFile,
      );

      const { type: readType, task: readTask } =
        await this.prismaService.makeTask(
          'read csv snapshot',
          {
            file_path: path,
            lastSize: existing.size,
          },
          task.id,
        );

      await this.addToQueue(readType, readTask, {});
    }
    await this.prismaService.finishTask(task);
  }

  async readCsvSnapshot(task) {
    const file = await this.prismaService.prisma.github_data_files.findFirst({
      where: {
        path: task.data.file_path,
      },
    });

    if (!file) {
      await this.prismaService.eventForTask(
        task.id,
        'cannot find file for task',
        task.data
      );
      return this.prismaService.finishTask(task, 'error');
    }

    /*  const gh = new GitHub(cred);
    const repo = gh.getRepo(GITHUB_USER, GITHUB_REPO);*/
    /*    const octokit = new Octokit ({
      auth: process.env.GITHUB_TOKEN,
    });*/

    try {
      await this.prismaService.eventForTask(
        task.id,
        'getting blob',
        file
      );

      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/blobs/${file.sha}`;
      console.log('getting content for file', file, 'from', url);
      const result = await axios.get(url);
      const { content } = result.data;
      console.log('content gotten for file', file);

      await this.prismaService.eventForTask(
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
      await this.prismaService.eventForTask(
        task.id,
        'error reading blob',
        err.message,
      );
      await this.prismaService.finishTask(task, 'error');
    }
  }

  async writeGithubFile(task, file, content) {
    const contentString = new Buffer(content, 'base64').toString();

    const csvPath = path.resolve(
      __dirname,
      `../../../../data_files/${file.path}`,
    );
    await this.prismaService.eventForTask(task.id, 'writing to file', {
      path: csvPath,
    });
    fs.writeFile(csvPath, contentString, async (fileErr) => {
      try {
        if (fileErr) {
          await this.prismaService.finishTask(task, 'error');
          await this.prismaService.eventForTask(task.id, 'file write error: ', {
            message: fileErr.message,
            path: csvPath,
          });
          await this.prismaService.prisma.github_data_files.update({
            where: {
              path: file.path,
            },
            data: {
              status: 'error writing',
            },
          });
        } else {
          await this.prismaService.eventForTask(task.id, 'file written', {
            path: csvPath,
          });
          await this.prismaService.prisma.github_data_files.update({
            where: {
              path: file.path,
            },
            data: {
              status: 'downloaded',
            },
          });
          await this.prismaService.finishTask(task);
          const { task: writeTask, type } = await this.prismaService.makeTask(
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
        await this.prismaService.eventForTask(task.id, 'error writing file', {
          message: err.message,
        });
        await this.prismaService.finishTask(task, 'error');
      }
    });
  }
}
