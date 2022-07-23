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
    cursor?: Prisma.task_typeWhereUniqueInput;
    where?: Prisma.task_typeWhereInput;
    orderBy?: Prisma.task_typeOrderByWithRelationInput;
  }): Promise<task[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.task.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
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
