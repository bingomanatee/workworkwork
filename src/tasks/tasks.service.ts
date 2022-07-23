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
    let { skip, take, cursor, where, orderBy } = params;
    if (!orderBy) {
      orderBy = {
        createdAt: 'desc',
      };
    }
    if (!take) {
      take = 200;
    }
    const find = {
      skip,
      take,
      cursor,
      where,
      orderBy,
    }

    console.log('finding tasks:', find);
    return this.prisma.task.findMany(find);
  }

  findOne(id: string) {
    return `This action returns a #${id} task`;
  }

  update(id: string, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task_type.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  remove(id: string) {
    return this.prisma.task_type.delete({
      where: { id },
    });
  }
}
