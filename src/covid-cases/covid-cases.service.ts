import { Injectable } from '@nestjs/common';
import { CreateCovidCaseDto } from './dto/create-covid-case.dto';
import { UpdateCovidCaseDto } from './dto/update-covid-case.dto';

@Injectable()
export class CovidCasesService {
  create(createCovidCaseDto: CreateCovidCaseDto) {
    return 'This action adds a new covidCase';
  }

  findAll() {
    return `This action returns all covidCases`;
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
