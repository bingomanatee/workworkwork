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
    const type = await this.prisma.task_type
      .findFirstOrThrow({
        where: {
          name: typeName,
        },
      })
      .catch(this.checkErrorForReboot);

    if (!type) {
      throw new Error(`cannot find type for ${typeName}`);
    }

    const task = await this.prisma.task
      .create({
        data: {
          task_type_id: type.id,
          data,
          parent_task_id,
        },
      })
      .catch(this.checkErrorForReboot);

    return { type, task };
  }

  async finishTask(task, status = 'done') {
    await this.prisma.task
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

  eventForTask(id, event: string, data = {}) {
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

    this.prisma.task_event
      .create({
        data: createData,
      })
      .then(NOOP)
      .catch((err) => {
        console.log('data:', createData, 'task event error:', err);
        console.log('---- error code: ', err.code);
        return this.checkErrorForReboot(err);
      });
  }
}
