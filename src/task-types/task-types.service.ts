import { Injectable } from '@nestjs/common';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { PrismaService } from './../prisma.service';
import { task_type, Prisma } from '@prisma/client';

@Injectable()
export class TaskTypesService {
  constructor(private prismaService: PrismaService) {}

  async create(createTaskTypeDto: CreateTaskTypeDto) {
    const siblings = await this.siblings(createTaskTypeDto);
    if (siblings) {
      const maxOrder = siblings.reduce((m, sib) => {
        return Math.max(m, sib.order);
      }, 0);
      createTaskTypeDto.order = maxOrder + 1;
    }
    return this.prismaService.prisma.task_type.create({
      data: createTaskTypeDto,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.task_typeWhereUniqueInput;
    where?: Prisma.task_typeWhereInput;
    orderBy?: Prisma.task_typeOrderByWithRelationInput;
  }) {
    // eslint-disable-next-line prefer-const
    let { skip, take, cursor, where, orderBy } = params;
    if (!where) {
      where = {
        deleted: false,
      };
    }
    return this.prismaService.prisma.task_type.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: string): Promise<task_type | null> {
    return this.prismaService.prisma.task_type.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: string, updateTaskTypeDto: UpdateTaskTypeDto) {
    return this.prismaService.prisma.task_type.update({
      where: { id },
      data: updateTaskTypeDto,
    });
  }

  remove(id: string) {
    return this.prismaService.prisma.task_type.update({
      where: { id },
      data: { deleted: true },
    });
  }

  private async siblings(record) {
    return this.prismaService.prisma.task_type.findMany({
      where: {
        parent_id: {
          equals: record.parent_id,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  private async findPeers(record) {
    const peers = await this.siblings(record);

    return peers.reduce(
      (memo, tt) => {
        if (tt.id === record.id) {
          memo.same = tt;
        } else if (tt.order >= record.order) {
          memo.after.push(tt);
        } else {
          memo.before.push(tt);
        }
        return memo;
      },
      {
        after: [],
        same: record,
        before: [],
      },
    );
  }

  async reorder(taskTypes) {
    for (let index = 0; index < taskTypes.length; ++index) {
      const record = taskTypes[index];
      if (record) {
        await this.prismaService.prisma.task_type.update({
          where: {
            id: record.id,
          },
          data: {
            order: index,
          },
        });
      }
    }
  }

  async promote(id: string) {
    const toMove = await this.findOne(id);
    if (!toMove) {
      throw new Error('cannot find taskType ' + id);
    }
    const peers = await this.findPeers(toMove);

    if (peers.after.length) {
      const shuffle = peers.after.shift();
      peers.after.push(peers.same);
      peers.same = shuffle;
    }

    return this.reorder([...peers.before, peers.same, ...peers.after]);
  }

  async demote(id: string) {
    const toMove = await this.findOne(id);
    if (!toMove) {
      throw new Error('cannot find taskType ' + id);
    }
    const peers = await this.findPeers(toMove);

    if (peers.before.length) {
      const shuffle = peers.before.pop();
      peers.before.push(peers.same);
      peers.same = shuffle;
    }

    return this.reorder([...peers.before, peers.same, ...peers.after]);
  }
}
