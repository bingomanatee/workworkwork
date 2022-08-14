import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as dayjs from 'dayjs';

const DATE_FORMAT = 'DD/MM/YYYY';

@Injectable()
export class PivotSummaryService {
  constructor(private prismaService: PrismaService) {}

  async getForField(field: string) {
    const pivots = await this.prismaService.prisma.covid_data_pivot.findMany({
      where: {
        field,
      },
    });

    let firstDate = dayjs();
    const records = pivots.map((pivot) => {
      const date = dayjs(pivot.date);
      if (date.isBefore(firstDate)) {
        firstDate = date;
      }

      const record = {
        date: date.format(DATE_FORMAT),
        day: date,
        iso3: pivot.iso_alpha_3,
        data: pivot.type === 'float' ? pivot.values_float : pivot.values_int,
        offset: 0,
        st: date.format(DATE_FORMAT),
      };

      return record;
    });

    records.forEach((record) => {
      record.st = firstDate.format(DATE_FORMAT);
      record.offset = record.day.diff(firstDate, 'd');
      delete record.day;
    });

    return records;
  }
}
