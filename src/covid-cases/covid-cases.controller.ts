import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CovidCasesService } from './covid-cases.service';
import { CreateCovidCaseDto } from './dto/create-covid-case.dto';
import { UpdateCovidCaseDto } from './dto/update-covid-case.dto';

@Controller('covid-cases')
export class CovidCasesController {
  constructor(private readonly covidCasesService: CovidCasesService) {}

  @Post()
  create(@Body() createCovidCaseDto: CreateCovidCaseDto) {
    return this.covidCasesService.create(createCovidCaseDto);
  }

  @Get()
  findAll() {
    return this.covidCasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.covidCasesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCovidCaseDto: UpdateCovidCaseDto) {
    return this.covidCasesService.update(+id, updateCovidCaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.covidCasesService.remove(+id);
  }
}
