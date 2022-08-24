import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma.service';
import { RecordBufferService } from '../../record-buffer/record-buffer.service';
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

@Injectable()
export class QueueManagerService {
  constructor(
    @InjectQueue('tasks') private taskQueue: Queue,
    private prismaService: PrismaService,
    private bufferService: RecordBufferService,
  ) {}

  public async enqueue(
    typeName: string,
    taskData = {},
    queueData = {},
    parentId?,
  ) {
    const { task, type } = await this.prismaService.makeTask(
      typeName,
      taskData,
      parentId,
    );

    return this.addTaskToQueue(type, task, queueData);
  }

  public async addTaskToQueue(type, task, data = {}) {
    this.taskQueue.add({
      ...data,
      type: type.name,
      type_id: type.id,
      task_id: task.id,
    });
  }

  eventQueue = [];
  writingEvent = false;

  clearEventQueue() {
    if (!this.eventQueue.length) {
      return;
    }
    const { id, event, data } = this.eventQueue.shift();
    return this.eventForTask(id, event, data);
  }

  initBuffer;

  async eventForTask(task, event: string, data = {}) {
    let id = task;
    if (typeof task === 'object') {
      id = task.id;
    }
    if (!this.initBuffer) {
      const { prisma } = this.prismaService;
      this.bufferService.init(
        'qmevents',
        (createData) => {
          return prisma.task_event
            .createMany({
              data: createData,
            })
            .then(NOOP)
            .catch((err) => {
              console.log('data:', createData, 'task event error:', err);
              console.log('---- error code: ', err.code);
            });
        },
        async (events, err) => {
          console.log('error writing event', events, err);
        },
        1,
      );
      this.initBuffer = true;
    }
    if (this.writingEvent) {
      this.eventQueue.push({ id, event, data });
      process.nextTick(() => this.clearEventQueue());
      return;
    }
    try {
      if (data !== null) {
        try {
          const jsonString = JSON.stringify(data);
        } catch (err) {
          data = {};
        }
      } else {
        data = {};
      }

      await this.bufferService.add(
        'qmevents',
        {
          task_id: id,
          event,
          data,
        },
        {},
      );
    } catch (err) {
      console.log('error in task_event: ', err.message);
    }
  }

  async taskError(task, err, message = 'error') {
    if (typeof err === 'string') {
      return this.taskError(task, null, err);
    }
    let stack = '';
    let errMessage = '';
    if (err) {
      errMessage = err.message;
      try {
        stack = JSON.stringify(err.stack);
      } catch (e) {
        // do nothing
      }
    }

    await this.eventForTask(task, message, { message: errMessage, stack });
    await this.finishTask(task, 'error');
  }

  async finishTask(task, status = 'done') {
    if (!(task && task.id)) {
      console.log('bad task:', task);
      throw new Error('bad task for finishTask');
    }
    const checkTask = await this.prismaService.prisma.task.findUniqueOrThrow({
      where: {
        id: task.id,
      },
    });
    if (checkTask.completedAt) {
      console.log('attempt to finish an already completed task', checkTask);
      return;
    }
    return this.prismaService.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        completedAt: new Date(),
        status,
      },
    });
  }
}
