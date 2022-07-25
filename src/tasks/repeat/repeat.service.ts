import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RepeatService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

 // @Cron('*/15 * * * * *')
  initialCron() {
    this.prisma.task_type
      .findMany({
        where: {
          interval: {
            gt: 0,
          },
        },
      })
      .then((types) => {
        return Promise.all(
          types.map(async (type) => {
            const { id } = type;
            if (this.startTaskIds.includes(id)) {
              return;
            }
            this.startTaskIds.push(id);

            console.log('running initial task', type.name);
            return this.initTask(type, true);
          }),
        );
      });
  }

  private async initTask(type, initial = false) {
    const task = await this.prisma.task.create({
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

  @Cron('*/15 * * * * *')
  handleCron() {
    this.prisma.task_type
      .findMany({
        where: {
          interval: {
            gt: 0,
          },
        },
      })
      .then((types) => {
        return Promise.all(
          types.map(async (type) => {
            const { interval } = type;
            const earliestInterval = Date.now() - interval * 1000;
            const recent = await this.prisma.task.findMany({
              where: {
                task_type_id: type.id,
                createdAt: {
                  gt: new Date(earliestInterval),
                },
              },
            });

            if (
              recent.length &&
              recent.some((item) => {
                return (
                  item.completedAt &&
                  item.completedAt > item.createdAt &&
                  item.status !== 'error'
                );
              })
            ) {
              console.log(
                'task type',
                type.name,
                'has been run recently -- ignoring',
              );
              return; // interval has been satisfied
            }

            return this.initTask(type);
          }),
        );
      });
  }

  startTaskIds: any[] = [];
}
