import { Injectable } from '@nestjs/common';
import { CreateCovidCaseDto } from './dto/create-covid-case.dto';
import { UpdateCovidCaseDto } from './dto/update-covid-case.dto';
import { PrismaService } from '../prisma.service';
import * as dayjs from 'dayjs';
import * as _ from 'lodash';
import { Dayjs } from 'dayjs';

@Injectable()
export class CovidCasesService {
  constructor(private prismaService: PrismaService) {}
  create(createCovidCaseDto: CreateCovidCaseDto) {
    return 'This action adds a new covidCase';
  }

  async findAll() {
    const dates = await this.prismaService.prisma.covid_stats_weekly.findMany({
      select: {
        week: true,
      },
      distinct: ['week'],
    });

    const weeks = dates.map(({ week }) => {
      const day = dayjs(week);
      return {
        week,
        day,
        time: day.unix(),
      };
    });

    const sortedWeeks = _.sortBy(weeks, 'time');

    console.log('weeks:', sortedWeeks);
    return this.prismaService.prisma.covid_stats_weekly.findMany({ take: 100 });
  }

  findOne(id: number) {
    return `This action returns a #${id} covidCase`;
  }

  update(id: number, updateCovidCaseDto: UpdateCovidCaseDto) {
    return `This action updates a #${id} covidCase`;
  }

  remove(id: number) {
    return `This action removes a #${id} covidCase`;
  }
}
