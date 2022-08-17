import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Response,
  Res,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('api/countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  findAll() {
    return this.countriesService.findAll();
  }

  @Get('geojson')
  getFile(@Res() res: Response) {
    const file = createReadStream(
      join(
        __dirname,
        '../../../src/countries/ne_110m_admin_0_countries.geojson.json',
      ),
    );
    // @ts-ignore
    file.pipe(res);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Res() res: Response) {
    if (id === 'geojason') {
      return this.getFile(res);
    }
    return this.countriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countriesService.update(id, updateCountryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
}
