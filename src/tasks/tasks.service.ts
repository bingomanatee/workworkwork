import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma.service';
import { Prisma, task } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TasksService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    return this.prismaService.prisma.task.create({
      data: createTaskDto,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.taskWhereUniqueInput;
    where?: Prisma.taskWhereInput;
    orderBy?: Prisma.taskOrderByWithRelationInput;
  }) {
    // eslint-disable-next-line prefer-const
    let { skip, take, cursor, where, orderBy } = params;
    if (!orderBy) {
      orderBy = {
        createdAt: 'desc',
      };
    }
    if (!take) {
      take = 1000;
    }
    const find = {
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        task_events: true,
      },
    };

    return this.prismaService.prisma.task.findMany(find);
  }

  async findOne(id: string) {
    return this.prismaService.prisma.task.findUnique({
      where: { id },
      include: {
        task_events: true,
      },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    return this.prismaService.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: string) {
    return this.prismaService.prisma.task.delete({
      where: { id },
    });
  }

  async repeatTask(id: string) {
    const task = await this.prismaService.prisma.task.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        type: true,
      },
    });

    const { data, parent_task_id, task_type_id } = task;
    const duplicateTask = await this.prismaService.prisma.task.create({
      data: {
        data,
        parent_task_id,
        task_type_id,
      },
    });

    this.addToQueue(task.type, duplicateTask);
    console.log('--- repeat queueing ', duplicateTask, task.type)
    return duplicateTask;
  }

  private async addToQueue(type, task, data = {}) {
    this.taskQueue.add({
      ...data,
      type: type.name,
      type_id: type.id,
      task_id: task.id,
    });
  }

  taskTest() {

  }
}
