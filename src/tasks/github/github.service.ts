import { Injectable } from '@nestjs/common';
import { task } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

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

console.log('========= github gred:', cred);

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
        console.log('createPollTask rate limit error');
        const gh = new GitHub(cred);
        gh.getRateLimit().getRateLimit((err, data) => {
          console.log('>>>>>> rate limit:', data);
        });
      } else {
        console.warn('error in cratePollTask:', err.message);
      }
      await this.prisma.finishTask(task, 'error');
    }
  }

  private async getGithubFiles(gh) {
    const repo = gh.getRepo(GITHUB_USER, GITHUB_REPO);
    const { data: branch } = await repo.getBranch('master');

    const {
      commit: {
        sha,
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
      console.log('climb tree error: ', err);
    }
  }

  async pollGithub(task) {
    const gh = new GitHub(cred);
    try {
      const files = await this.getGithubFiles(gh);
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
      await this.prisma.github_data_files.update({
        where: { path },
        data: {
          sha,
          size,
        },
      });
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
      console.log('cannot find file for ', task);
      return this.prisma.finishTask(task, 'error');
    }
    if (file.status !== 'created') {
      //@TODO: process file size change
      console.log('file is not new -- leaving alone', task);
      return this.prisma.finishTask(task, 'done');
    }

    /*  const gh = new GitHub(cred);
    const repo = gh.getRepo(GITHUB_USER, GITHUB_REPO);*/
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    try {
      console.log('getting blob of ', file.sha);
      let {
        data: { content },
      } = await octokit.rest.git.getBlob({
        owner: GITHUB_USER,
        repo: GITHUB_REPO,
        file_sha: file.sha,
      });

      console.log('done getting blob of ', file.sha);

      const contentString = new Buffer(content, 'base64').toString();
      content = '';

      const fullPath = path.resolve(
        __dirname,
        `../../../data_files/${file.path}`,
      );
      fs.writeFile(fullPath, contentString, async (fileErr) => {
        if (fileErr) {
          await this.prisma.finishTask(task, 'error');
          console.log('file write error: ', fileErr);
          await this.prisma.github_data_files.update({
            where: {
              path: file.path,
            },
            data: {
              status: 'error reading',
            },
          });
        } else {
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
      });
    } catch (err) {
      console.log('---- error reading blob', err);
    }
  }
}
