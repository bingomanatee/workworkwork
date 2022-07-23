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
                type.id,
                'has been run recently -- ignoring',
                recent
              );
              return; // interval has been satisfied
            }

            const task = await this.prisma.task.create({
              data: {
                task_type_id: type.id,
              },
            });

            const def = {
              task_id: task.id,
              type_id: type.id,
              type: type.name,
              createdAt: task.createdAt.toUTCString(),
            };
            console.log('---->>> creating task for type', type.id, def);

            this.taskQueue.add(def);
          }),
        );
      });
  }
}
