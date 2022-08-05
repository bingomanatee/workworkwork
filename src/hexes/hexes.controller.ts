import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HexesService } from './hexes.service';
import { CreateHexDto } from './dto/create-hex.dto';
import { UpdateHexDto } from './dto/update-hex.dto';

@Controller('hexes')
export class HexesController {
  constructor(private readonly hexesService: HexesService) {}

  @Post()
  create(@Body() createHexDto: CreateHexDto) {
    return this.hexesService.create(createHexDto);
  }

  @Get('level/:level')
  findAll(@Param('level') level: number) {
    return this.hexesService.findAll(level);
  }

  @Get('hindex/:hindex')
  findOne(@Param('hindex') hindex: string) {
    return this.hexesService.findOne(hindex);
  }

  @Patch(':hindex')
  update(@Param('hindex') hindex: string, @Body() updateHexDto: UpdateHexDto) {
    return this.hexesService.update(hindex, updateHexDto);
  }

  @Delete(':hindex')
  remove(@Param('hindex') hindex: string) {
    return this.hexesService.remove(hindex);
  }
}
