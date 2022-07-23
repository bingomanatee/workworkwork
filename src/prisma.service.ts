import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async makeTask(typeName, data, parent_task_id = null) {
    const type = await this.task_type.findFirstOrThrow({
      where: {
        name: typeName,
      },
    });

    const task = await this.task.create({
      data: {
        task_type_id: type.id,
        data,
        parent_task_id,
      },
    });

    return { type, task };
  }

  async finishTask(task, status = 'done') {
    await this.task.update({
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
