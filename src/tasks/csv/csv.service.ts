import { Injectable } from '@nestjs/common';
import { task } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { parse } from 'csv-parse';
import CaseRow from './CaseRow';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class CsvService {
  pendingCases = [];
  pendingLocations = [];

  constructor(
    private prisma: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  async writeCsvRecords(task: task) {
    const input = parse({
      cast: true,
      cast_date: true,
      columns: true,
      delimiter: ',',
      on_record: (record) => {
        return new CaseRow(record);
      },
    });

    const fullPath = path.resolve(
      __dirname,
      `../../../data_files/${task.data['filePath']}`,
    );

    const stream = fs.createReadStream(fullPath);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    let rowCount = 0;
    input
      .on('data', function (row) {
        //@TODO: write to database
        // at this point we are just running over the rows
        // and incrementing the count
        ++rowCount;
        target.pushRow(row);
      })
      .on('error', (err) => {
        this.prisma.task_event.create({
          data: {
            task_id: task.id,
            event: 'error in sql',
            data: {
              message: err.message,
            },
          },
        });
      })
      .on('end', function () {
        target.prisma.task_event.create({
          data: {
            task_id: task.id,
            event: 'row count',
            data: {
              rowCount,
            },
          },
        });
        target.flushRows();
      });

    stream.on('data', (chunk) => input.write(chunk.toString()));

    stream.once('end', () => {
      this.flushRows();
      input.end();
    });

    stream.once('error', () => {
      this.flushRows(true);
      input.end();
    });
  }

  pushRow(row: CaseRow) {
    this.pendingCases.push(row.case);
    this.pendingLocations.push(row.location);
  }

  private flushRows(error = false) {}
}
