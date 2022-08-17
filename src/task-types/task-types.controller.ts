import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { TaskTypesService } from './task-types.service';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';

@Controller('api/task-types')
export class TaskTypesController {
  constructor(private readonly taskTypesService: TaskTypesService) {}

  @Post()
  create(@Body() createTaskTypeDto: CreateTaskTypeDto) {
    return this.taskTypesService.create(createTaskTypeDto);
  }

  @Get()
  findAll() {
    return this.taskTypesService.findAll({});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTypesService.findOne(id);
  }

  @Put(':id/promote')
  promote(@Param('id') id: string) {
    return this.taskTypesService.promote(id);
  }

  @Put(':id/demote')
  demote(@Param('id') id: string) {
    return this.taskTypesService.demote(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskTypeDto: UpdateTaskTypeDto,
  ) {
    return this.taskTypesService.update(id, updateTaskTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskTypesService.remove(id);
  }
}
