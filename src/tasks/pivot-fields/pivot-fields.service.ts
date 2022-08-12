import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { create } from '@wonderlandlabs/collect';

const PIVOT_TAKE = 5000;

@Injectable()
export class PivotFieldsService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  private async makeIsoMap(task, field) {
    const isoMap = create(new Map());
    try {
      let rows = [];
      let skip = 0;
      do {
        rows = await this.prismaService.prisma.covid_data_denormalized.findMany(
          {
            orderBy: [
              {
                iso_alpha_3: 'asc',
              },
              {
                date: 'asc',
              },
            ],
            skip,
            take: PIVOT_TAKE,
            select: {
              date: true,
              iso_alpha_3: true,
              [field]: true,
            },
          },
        );
        skip += PIVOT_TAKE;
        rows.forEach((row) => {
          if (row[field] === null) {
            return;
          }
          const { date, iso_alpha_3 } = row;
          if (!isoMap.hasKey(iso_alpha_3)) {
            isoMap.set(iso_alpha_3, create(new Map()));
          }
          isoMap.get(iso_alpha_3).set(date, row[field]);
        });
      } while (rows.length);
    } catch (err) {
      console.log('error in isoMap', err);
      this.prismaService.eventForTask(task.id, 'isoMap error', {
        message: err.message,
      });
      this.prismaService.finishTask(task, 'error');
      return { isoMap, err };
    }

    return { isoMap };
  }

  private isoMapToData(task, isoMap, field, type) {
    return isoMap.reduce((data, dataMap, iso3) => {
      const dates = dataMap.keys.map((date, i) => {
        const asDayJS = dayjs(date);
        return {
          date,
          i,
          asDayJS,
          unix: asDayJS.unix(),
        };
      });
      let first;
      dates.forEach((stamp, index) => {
        if (index === 0) {
          stamp.offset = 0;
          first = stamp;
        } else {
          stamp.offset = stamp.asDayJS.diff(first.asDayJS, 'd');
        }
      });

      const values = [];
      dates.forEach((stamp) => {
        const value = dataMap.get(stamp.date);
        while (values.length < stamp.offset) {
          values.push(value);
        }
      });

      console.log('iso:', iso3);
      console.log('dates:', dates.slice(0, 10));
      console.log('values:', values.slice(0, 10));

      const record = {
        field,
        iso_alpha_3: iso3,
        type,
        date: first.date,
        [type === 'int' ? 'values_int' : 'values_float']: values,
      };

      console.log('data for', iso3, record);

      data.push(record);
      return data;
    }, []);
  }

  async pivotField(task) {
    const { field, type } = task.data;
    console.log('================= pivot field task:', task);
    await this.prismaService.eventForTask(task.id, 'pivoting', {
      field,
      type,
    });

    const { isoMap, err } = await this.makeIsoMap(task, field);
    if (err) {
      return;
    }
    try {
      await this.prismaService.prisma.covid_data_pivot.deleteMany({
        where: {
          field,
        },
      });
    } catch (err) {
      console.log('error in deleteMany', task.data, err);
      this.prismaService.eventForTask(task.id, 'deleteMany error', {
        message: err.message,
      });
      this.prismaService.finishTask(task, 'error');
      return;
    }

    try {
      const data = this.isoMapToData(task, isoMap, field, type);

      await this.prismaService.prisma.covid_data_pivot.createMany({
        data,
      });
    } catch (err) {
      console.log('error in createMany', task.data, err);
      this.prismaService.eventForTask(task.id, 'createMany error', {
        message: err.message,
      });
      this.prismaService.finishTask(task, 'error');
      return;
    }

    await this.prismaService.finishTask(task);
  }

  private async getPivotFieldIsoData(date, iso_alpha_3) {
    return await this.prismaService.prisma.covid_data_denormalized.findMany({
      select: {
        date: true,
        deaths: true,
        hosp: true,
        icu: true,
        vent: true,
      },
      where: {
        iso_alpha_3,
      },
      orderBy: [{ date: 'asc' }],
    });
  }

  async createPivotRecords(task) {
    const pivotFieldType = await this.prismaService.typeByName('pivot field');
    [
      {
        field: 'deaths',
        type: 'int',
      },
      {
        field: 'hosp',
        type: 'int',
      },
    ].forEach((data) => {
      this.initTask(
        pivotFieldType,
        true,
        {
          ...data,
          creator: 'createPivotRecords',
        },
        task.id,
      );
    });
    await this.prismaService.finishTask(task);
  }

  private async initTask(type, initial = false, data = {}, parentId = null) {
    const response = await this.prismaService.makeTask(
      type.name,
      {
        initial,
        ...data,
      },
      parentId,
    );

    if (!response) {
      return;
    }
    const { task } = response;

    if (task) {
      const def = {
        task_id: task.id,
        type_id: type.id,
        type: type.name,
        createdAt: task.createdAt.toUTCString(),
      };
      console.log('====== running task ', type.name, def);

      this.taskQueue.add(def);
    }
  }
}
