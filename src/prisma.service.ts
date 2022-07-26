import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;
let globalWithPrisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

let connected = false;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

@Injectable()
export class PrismaService implements OnModuleInit {
  public prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async onModuleInit() {
    if (!connected) {
      connected = true;
      await this.prisma.$connect();
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.prisma.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async makeTask(typeName, data, parent_task_id = null) {
    const type = await this.typeByName(typeName);

    if (!type) {
      throw new Error(`cannot find type for ${typeName}`);
    }

    const task = await this.prisma.task.create({
      data: {
        data,
        task_type_id: type.id,
        parent_task_id,
      },
    });

    return { type, task };
  }

  finishTask(task, status = 'done') {
    if (!(task && task.id)) {
      console.log('bad task:', task);
      throw new Error('bad task for finishTask');
    }
    return this.prisma.task
      .update({
        where: {
          id: task.id,
        },
        data: {
          completedAt: new Date(),
          status,
        },
      })
      .catch(this.checkErrorForReboot);
  }

  rebooting = null;

  async rebootPrisma() {
    console.log('---- rebooting prisma ------');
    if (this.rebooting) {
      await this.rebooting;
      return;
    }
    let doneFn, failFn;
    this.rebooting = new Promise((done, fail) => {
      doneFn = done;
      failFn = fail;
    });

    try {
      await this.prisma.$disconnect();
      if (globalWithPrisma) {
        globalWithPrisma.prisma = new PrismaClient();
        this.prisma = globalWithPrisma.prisma;
      } else {
        prisma = new PrismaClient();
        this.prisma = prisma;
      }
      doneFn();
    } catch (err) {
      console.log('error rebooting prisma');
      failFn(err);
    }

    this.rebooting = null;
  }

  async checkErrorForReboot(err) {
    if (err.code === 'P2024') {
      console.log('error in connection; rebooting prisma');
      await this.rebootPrisma();
    } else {
      console.log('other error code: ', err.code);
    }
    throw err;
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
  async eventForTask(id, event: string, data = {}) {
    if (this.writingEvent) {
      this.eventQueue.push({ id, event, data });
      process.nextTick(() => this.clearEventQueue());
      return;
    }
    this.writingEvent = true;
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

      const createData = {
        task_id: id,
        event,
        data,
      };

      await this.prisma.task_event
        .create({
          data: createData,
        })
        .then(NOOP)
        .catch((err) => {
          console.log('data:', createData, 'task event error:', err);
          console.log('---- error code: ', err.code);
        });
    } catch (err) {
      console.log('error in task_event: ', err.message);
    }
    this.writingEvent = false;
    if (this.eventQueue.length) {
      process.nextTick(() => this.clearEventQueue());
    }
  }

  async typeByName(name: string) {
    return this.prisma.task_type.findUniqueOrThrow({
      where: {
        name,
      },
    });
  }
}
