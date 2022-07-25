import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TasksService } from '../tasks.service';
import { PrismaService } from '../../prisma.service';
import { Queue } from 'bull';
import { GithubService } from '../github/github.service';
import { CsvService } from '../csv/csv.service';

@Processor('tasks')
export class TaskProcessor {
  constructor(
    private readonly tasksService: TasksService,
    @InjectQueue('tasks') private taskQueue: Queue,
    private prisma: PrismaService,
    private github: GithubService,
    private csv: CsvService,
  ) {}

  @Process()
  async handleTask(job: Job) {
    const { task_id, type_id } = job.data;

    const [type, task] = await Promise.all([
      this.prisma.task_type.findUniqueOrThrow({
        where: {
          id: type_id,
        },
      }),
      this.prisma.task.findUniqueOrThrow({
        where: {
          id: task_id,
        },
      }),
    ]);

    switch (type?.name) {
      case 'update data':
        await this.github.createPollTask(task);
        break;

      case 'poll github':
        await this.github.pollGithub(task);
        break;

      case 'process github file':
        await this.github.processFile(task);
        break;

      case 'read csv snapshot':
        await this.github.readCsvSnapshot(task);
        break;

      case 'write csv records':
        await this.csv.writeCsvRecords(task);
        break;

      default:
        console.log('--- no handler for ', type?.name);
    }
  }
}
