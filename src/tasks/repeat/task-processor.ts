import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TasksService } from '../tasks.service';
import { PrismaService } from '../../prisma.service';
import { Queue } from 'bull';
import { CsvService } from '../csv/csv.service';
import { PivotFieldsService } from '../pivot-fields/pivot-fields.service';
import { StatesService } from '../states/states.service';

@Processor('tasks')
export class TaskProcessor {
  constructor(
    private readonly tasksService: TasksService,
    @InjectQueue('tasks') private taskQueue: Queue,
    private prismaService: PrismaService,
    private csv: CsvService,
    private pivotField: PivotFieldsService,
    private stateService: StatesService,
  ) {}

  @Process()
  async handleTask(job: Job) {
    console.log('handling task', job.data);
    const { task_id, type_id } = job.data;
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
        case 'update state csv data':
          await this.csv.fetchStateSsvData(task);
          break;

        case 'update country csv data':
          await this.csv.fetchCountryCsvData(task);
          break;

        case 'write csv records':
          await this.csv.writeCsvRecords(task, type);
          break;

        case 'create pivot records':
          await this.pivotField.createPivotRecords(task);
          break;
        case 'create state pivot records':
          await this.stateService.createStatePivotRecords(task);
          break;

        case 'pivot field':
          await this.pivotField.pivotField(task);
          break;

        case 'pivot field iso':
          //  await this.pivotField.pivotFieldIso(task);
          break;

        case 'localize states to hexes':
          await this.stateService.localizeStates(task);
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
