import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskTypesModule } from './task-types/task-types.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TaskTypesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
