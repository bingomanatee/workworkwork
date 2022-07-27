import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CsvService } from './csv/csv.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly csvService: CsvService,
  ) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Post(':id')
  repeat(@Param('id') id: string) {
    return this.tasksService.repeatTask(id);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll({});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    if (id === 'taskTest') return this.taskTest();
    return this.tasksService.findOne(id);
  }

  @Get('taskTest')
  taskTest() {
    return this.csvService.taskTest();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
