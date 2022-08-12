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

import create from '@wonderlandlabs/collect';
import { Cron } from '@nestjs/schedule';
import CovidDataDenorm from './CovidDataDenorm';

const IDENTITY = (input) => input;
const FLUSH_INTERVAL = 1000;
const MESSAGE_INTERVAL = 10;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};
const MAX_ROW_COUNT = 10000;

@Injectable()
export class CsvService {
  pendingCases = [];
  pendingLocations = create(new Map());
  flushedLocations = create(new Map());

  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

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

  pendingRecords = [];
  saving = false;

  async saveRows(data) {
    if (!data.length) return;
    if (data.length > MAX_ROW_COUNT) {
      this.pendingRecords = data.slice(MAX_ROW_COUNT);
      return this.saveRows(data.slice(0, MAX_ROW_COUNT));
    }
    if (this.saving) {
      this.pendingRecords = this.pendingRecords.concat(data);
      return;
    }
    try {
      this.saving = true;
      // @ts-ignore
      await this.prismaService.prisma.covid_data_denormalized.createMany({
        data,
        skipDuplicates: true,
      });
      console.log('saved ', data.length, 'records');
    } catch (err) {
      console.error('error with saveRows:', err);
    }
    this.saving = false;
    if (this.pendingRecords.length) {
      const more = this.pendingRecords;
      this.pendingRecords = [];
      return this.saveRows(more);
    }
  }
  readingDataFiles = false
  /***
   * reads the CSV file into the database;
   * @param task
   * @param type
   */
  async readDataFiles(task, type) {
    if (this.readingDataFiles) {
      this.prismaService.finishTask(task);
    }
    this.readingDataFiles = true;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    const csvPath = path.resolve(__dirname, '../../../../data_files/1 2.csv');
    if (!fs.existsSync(csvPath)) {
      await this.prismaService.eventForTask(task.id, 'no datafile', {
        path: csvPath,
      });
    }
    // await this.prismaService.prisma.covid_data_denormalized.deleteMany({});
    let badDataCount = 0;
    let error = null;
    let pendingRecords = [];
    await CsvService.processCSV(csvPath, {
      onRecord(input) {
        const { date, iso_alpha_3 } = input;
        badDataCount += 1;
        if (!(date && iso_alpha_3)) {
          return null;
        }
        return new CovidDataDenorm(input);
      },
      onData(row) {
        if (!row) return;
        pendingRecords.push(row);
        if (pendingRecords.length > 1000) {
          target.saveRows(pendingRecords);
          pendingRecords = [];
        }
      },
      async onEnd() {
        if (!error) {
          target.readingDataFiles = false;
          await target.prismaService.eventForTask(task.id, 'csv rfead', {
            rows: target.pendingRecords.length,
          });
          target.saveRows(pendingRecords);
          target.prismaService.finishTask(task);
        }
      },
      async onError(err) {
        if (!error) {
          target.readingDataFiles = false;
          error = err;
          await target.prismaService.eventForTask(task.id, 'csv error', {
            message: err.message,
          });

          target.prismaService.finishTask(task, 'error');
        }
      },
    });
  }
}
