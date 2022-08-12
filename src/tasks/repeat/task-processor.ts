import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TasksService } from '../tasks.service';
import { PrismaService } from '../../prisma.service';
import { Queue } from 'bull';
import { GithubService } from '../github/github.service';
import { CsvService } from '../csv/csv.service';
import { PivotFieldsService } from '../pivot-fields/pivot-fields.service';

@Processor('tasks')
export class TaskProcessor {
  constructor(
    private readonly tasksService: TasksService,
    @InjectQueue('tasks') private taskQueue: Queue,
    private prismaService: PrismaService,
    private github: GithubService,
    private csv: CsvService,
    private pivotField: PivotFieldsService,
  ) {}

  @Process()
  async handleTask(job: Job) {
    const { task_id, type_id } = job.data;
    return;

    const [type, task] = await Promise.all([
      this.prismaService.prisma.task_type.findUniqueOrThrow({
        where: {
          id: type_id,
        },
      }),
      this.prismaService.prisma.task.findUniqueOrThrow({
        where: {
          id: task_id,
        },
      }),
    ]);

    try {
      switch (type?.name) {
        case 'process csv data':
          await this.csv.readDataFiles(task, type);
          break;

        case 'csv rows to country data':
          await this.csv.saveRows([]);
          break;

        case 'create pivot records':
          await this.pivotField.createPivotRecords(task);
          break;

        case 'pivot field':
          await this.pivotField.pivotField(task);
          break;

        case 'pivot field iso':
        //  await this.pivotField.pivotFieldIso(task);
          break;

        default:
          console.log('--- no handler for ', type?.name);
      }
    } catch (err) {
      await this.prismaService.eventForTask(task.id, 'untrapped task error', {
        message: err.message,
      });
      await this.prismaService.finishTask(task, 'error');
    }
  }
}
