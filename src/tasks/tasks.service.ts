import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma.service';
import { Prisma, task } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: createTaskDto,
    });
  }

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.taskWhereUniqueInput;
    where?: Prisma.taskWhereInput;
    orderBy?: Prisma.taskOrderByWithRelationInput;
  }): Promise<task[]> {
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

    return this.prisma.task.findMany(find);
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        task_events: true,
      },
    });
  }

  update(id: string, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
