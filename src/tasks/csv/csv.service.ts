import { Injectable } from '@nestjs/common';
import { task } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { parse } from 'csv-parse';
import CaseRow from './CaseRow';
import * as fs from 'fs';
import * as path from 'path';
import { once } from 'lodash';

const IDENTITY = (input) => input;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

@Injectable()
export class CsvService {
  pendingCases = [];
  pendingLocations = [];

  constructor(
    private prisma: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  async writeCsvRecords(task: task) {
    const fullPath = path.resolve(
      __dirname,
      `../../../../data_files/${task.data['filePath']}`,
    );

    console.log('write csv records from ', fullPath);

    const target = this;
    let rowCount = 0;
    const onRecord = (record) => new CaseRow(record);

    const onError = (err) => {
      this.prisma.eventForTask(task.id, 'error in sql', {
        message: err.message,
      });
      target.prisma.eventForTask(task.id, 'error', { message: err.message });
      target.prisma.finishTask(task, 'error');
    };

    const onEnd = () => {
      this.prisma.eventForTask(task.id, 'row count', {
        rowCount,
      });
      target.flushRows();
      target.prisma.finishTask(task);
    };

    const onData = (row) => {
      //@TODO: write to database
      // at this point we are just running over the rows
      // and incrementing the count
      ++rowCount;
      target.pushRow(row);
    };

    CsvService.processCSV(fullPath, {
      onData,
      onEnd,
      onError,
      onRecord,
    });
  }

  static processCSV(
    fullPath,
    { onError = IDENTITY, onData, onEnd = NOOP, onRecord = IDENTITY },
  ) {
    const input = parse({
      cast: true,
      cast_date: true,
      columns: true,
      delimiter: ',',
      on_record: onRecord,
    });

    const error = once(onError);

    const stream = fs.createReadStream(fullPath);

    input.on('data', onData).on('error', error).on('end', onEnd);
    stream.on('data', (chunk) => input.write(chunk.toString()));
    stream.once('end', () => {
      input.end();
    });
    stream.once('error', error);
  }

  pushRow(row: CaseRow) {
    this.pendingCases.push(row.case);
    this.pendingLocations.push(row.location);
  }

  private flushRows(error = false) {
    console.log('flush rows');
  }
}
