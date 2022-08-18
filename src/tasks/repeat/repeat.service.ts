import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as dayjs from 'dayjs';

const STALE_TASK_AGE = 20;

@Injectable()
export class RepeatService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  @Cron('*/3 * * * *')
  async runRepeatingTasks() {
    const request = {
      where: {
        interval: {
          gt: 0,
        },
      },
    };
    const types = await (async () =>
      this.prismaService.prisma.task_type.findMany(request))().catch((err) => {
      console.log('error in task_type.findMany', request, err);
      throw err;
    });

    for (let i = 0; i < types.length; ++i) {
      await this.checkTypeInterval(types[i]);
    }
  }

  private async checkTypeInterval(type) {
    console.log('interval check for ', type.name);
    const { interval } = type;
    const earliestInterval = Date.now() - interval * 1000;
    const recent = await (async () =>
      this.prismaService.prisma.task.findMany({
        where: {
          task_type_id: type.id,
          createdAt: {
            gt: new Date(earliestInterval),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }))().catch((err) => {
      console.log('error on request from type', type, err);
      throw err;
    });

    if (recent.length) {
      console.log(
        type.name,
        ' -- within time frame for ',
        recent.length,
        'runs',
      );
      return; // interval has been satisfied
    }

    return this.initTask(type);
  }
  /*

  //@Cron('*!/2 * * * * *')
  private async reanimateDeadTasks() {
    const startedTasks = await this.prismaService.prisma.task.findMany({
      where: {
        status: 'started',
      },
      include: {
        task_events: true,
        type: true,
      },
    });
    const firstDead = startedTasks
      .filter((task) => task.type.interval === 0)
      .find((task) => {
        let date = task.createdAt;

        task.task_events.forEach((event) => {
          if (event.createdAt.getTime() > date.getTime()) {
            date = event.createdAt;
          }
        });

        const day = dayjs(date);
        const age = dayjs().diff(day, 'minute');

        if (age > STALE_TASK_AGE) {
          return true;
        }
      });

    if (firstDead) {
      await this.prismaService.eventForTask(
        firstDead.id,
        'marked as stale- restarting',
      );
      this.prismaService.finishTask(firstDead, 'stale');
      const { data, parent_task_id, task_type_id } = firstDead;
      const duplicateTask = await this.prismaService.prisma.task.create({
        data: {
          data,
          parent_task_id,
          task_type_id,
        },
      });

      this.addToQueue(firstDead.type, duplicateTask);
      console.log(
        '--- reanimating ',
        firstDead.id,
        'as',
        duplicateTask,
        firstDead.type,
      );
    }
  }
*/

  private async addToQueue(type, task, data = {}) {
    this.taskQueue.add({
      ...data,
      type: type.name,
      type_id: type.id,
      task_id: task.id,
    });
  }

  private async initTask(type, initial = false) {
    const task = await this.prismaService.prisma.task.create({
      data: {
        task_type_id: type.id,
        data: {
          initial,
        },
      },
    });

    const def = {
      task_id: task.id,
      type_id: type.id,
      type: type.name,
      createdAt: task.createdAt.toUTCString(),
    };
    console.log('====== running task ', type.name, def);

    this.taskQueue.add(def);
  }

  startTaskIds: any[] = [];
}
