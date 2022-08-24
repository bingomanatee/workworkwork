import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { latLngToCell } from 'h3-js';
import { QueueManagerService } from '../../queues/queue-manager/queue-manager.service';
import * as dayjs from 'dayjs';

@Injectable()
export class StatesService {
  constructor(
    private prismaService: PrismaService, //  @InjectQueue('tasks') private taskQueue: Queue,
    private queueManagerService: QueueManagerService,
  ) {}

  async localizeStates(task) {
    const states = await this.prismaService.prisma.states.findMany({});
    const start = Date.now();
    try {
      for (
        let locationIndex = 0;
        locationIndex < states.length;
        ++locationIndex
      ) {
        const location = states[locationIndex];
        const { latitude, longitude } = location;
        const hindexes = [];
        for (let level = 0; level < 5; ++level) {
          const hindex = latLngToCell(latitude, longitude, level);
          hindexes[level] = hindex;
        }
        if (!(locationIndex % 100)) {
          console.log(
            'localized ',
            locationIndex,
            'records',
            (locationIndex * 1000) / (Date.now() - start),
            'records/second',
          );
        }

        await this.prismaService.prisma.states.update({
          where: { id: location.id },
          data: {
            hindexes,
          },
        });
      }
    } catch (err) {
      await this.prismaService.eventForTask(task.id, 'localize error', {
        message: err.message,
      });
      this.prismaService.finishTask(task, 'error');
      return;
    }
    console.log('took ', Date.now() - start, 'ms');
    this.prismaService.finishTask(task);

    await this.queueManagerService.enqueue(
      'create state pivot records',
      { level: 'state' },
      {},
      task.id,
    );
  }

  async createStatePivotRecords(task) {
    const states = await this.prismaService.prisma.states.findMany({});

    const hexSet: Set<string> = states.reduce((memo, state) => {
      state.hindexes.forEach((hIndex) => memo.add(hIndex));
      return memo;
    }, new Set<string>());

    const hexes = Array.from(hexSet.values());

    await this.prismaService.prisma.covid_hex_pivot.deleteMany({});
    try {
      for (let i = 0; i < hexes.length; ++i) {
        const hex = hexes[i];

        const stateIds = states
          .filter((state) => {
            return state.hindexes.includes(hex);
          })
          .map((state) => state.id);

        await this.countHexStates(hex, stateIds, task);
      }
      return this.queueManagerService.finishTask(task);
    } catch (err) {
      console.log('error in pivoting states:', err);
      return this.queueManagerService.taskError(task, err);
    }
  }

  private async countHexStates(hindex: string, stateIds: string[], task) {
    const covid_state = await this.prismaService.prisma.covid_state.findMany({
      where: {
        id: {
          in: stateIds,
        },
      },
      select: {
        deaths: true,
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (!covid_state.length) {
      return;
    }

    const { date } = covid_state[0];
    const day = dayjs(date);
    const values = [];

    covid_state.forEach(({ date, deaths }) => {
      if (!deaths) return;
      const at = dayjs(date);
      const index = at.diff(day, 'd');
      if (values[index]) {
        values[index] += deaths;
      } else {
        values[index] = deaths;
      }
    });

    return this.prismaService.prisma.covid_hex_pivot.create({
      data: {
        hindex,
        field: 'deaths',
        date,
        type: 'int',
        values_int: values,
      },
    });
  }
}
