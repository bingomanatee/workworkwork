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
import axios from 'axios';
import _ from 'lodash';

const IDENTITY = (input) => input;
const FLUSH_INTERVAL = 1000;
const MESSAGE_INTERVAL = 10;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};
const MAX_ROW_COUNT = 10000;

const COUNTRY_CSV_URL = 'https://storage.covid19datahub.io/level/1.csv';
const COUNTRY_CSV_FILE_PATH = path.resolve(
  __dirname,
  '../../../../data_files/1 2.csv',
);

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

  async saveRows(task, data = []) {
    if (this.saving) {
      if (data.length) {
        this.pendingRecords = _.uniq(this.pendingRecords.concat(data));
      }
      return;
    }
    if (!data.length) {
      if (this.pendingRecords.length) {
        data = this.pendingRecords.splice(0, MAX_ROW_COUNT);
      } else return;
    } else if (data.length > MAX_ROW_COUNT) {
      console.log('saving some of pendingRecords', data.length);
      const chunk = data.splice(0, MAX_ROW_COUNT);
      this.pendingRecords = [...this.pendingRecords, ...data];
      data = chunk;
    } else {
      console.log('saving pending records:', data.length);
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
      await this.prismaService.eventForTask(task.id, 'saved records', {
        count: data.length,
      });
    } catch (err) {
      console.log('save error: ', err);
      await this.prismaService.eventForTask(task.id, 'error saving records', {
        error: err.message,
      });
    }

    this.saving = false;
    if (this.pendingRecords.length) {
      return this.saveRows(task);
    }
  }

  /***
   * reads the CSV file into the database;
   * @param task
   * @param type
   */
  async readDataFiles(task, type) {
    console.log('1readDataFiles ', COUNTRY_CSV_FILE_PATH);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    if (!fs.existsSync(COUNTRY_CSV_FILE_PATH)) {
      await this.prismaService.eventForTask(task.id, 'no datafile', {
        path: COUNTRY_CSV_FILE_PATH,
      });

      this.prismaService.finishTask(task, 'error');
      return;
    }
    // await this.prismaService.prisma.covid_data_denormalized.deleteMany({});
    let badDataCount = 0;
    let error = null;
    let rows = 0;
    await CsvService.processCSV(COUNTRY_CSV_FILE_PATH, {
      onRecord(input) {
        const { date, iso_alpha_3 } = input;
        badDataCount += 1;
        if (!(date && iso_alpha_3)) {
          return null;
        }
        return new CovidDataDenorm(input);
      },
      async onData(row) {
        if (!row) {
          ++badDataCount;
          return;
        }
        ++rows;
        target.pendingRecords.push(row);
        if (target.pendingRecords.length >= MAX_ROW_COUNT) {
          if (!target.saving) {
            target.saveRows(task);
          }
        }
      },
      async onEnd() {
        if (!error) {
          await target.prismaService.eventForTask(task.id, 'csv read', {
            rows: target.pendingRecords.length,
          });
          await target.saveRows(task);
          target.prismaService.eventForTask(task.id, 'finished csv file', {
            rows,
            badDataCount,
          });
          target.prismaService.finishTask(task);

          const { task: pivotTask, type } = await target.prismaService.makeTask(
            'create pivot records',
            { level: 'country' },
            task.parent_task_id,
          );

          target.addToQueue(type, pivotTask);
        }
      },
      async onError(err) {
        if (!error) {
          error = err;
          await target.prismaService.eventForTask(task.id, 'csv error', {
            message: err.message,
          });

          target.prismaService.finishTask(task, 'error');
        }
      },
    });
  }

  public fetchDataFiles(task) {
    console.log('--- fetching data files');
    const target = this;
    axios({
      method: 'get',
      url: COUNTRY_CSV_URL,
      responseType: 'stream',
    })
      .then(function (response) {
        const targetStream = fs.createWriteStream(COUNTRY_CSV_FILE_PATH);
        targetStream.on('finish', async () => {
          await target.prismaService.finishTask(task);
          const { type, task: writeTask } = await target.prismaService.makeTask(
            'write csv records',
            { type: 'country' },
            task.id,
          );
          target.addToQueue(type, writeTask);
        });
        targetStream.on('error', async (err) => {
          await target.prismaService.eventForTask(
            task.id,
            'file write failure',
            {
              message: err.message,
            },
          );
          return target.prismaService.finishTask(task, 'error');
        });
        response.data.pipe(targetStream);
      })
      .catch(async (err) => {
        await target.prismaService.eventForTask(task.id, 'axios failure', {
          message: err.message,
        });
        return target.prismaService.finishTask(task, 'error');
      });
  }

  private async addToQueue(type, task, data = {}) {
    this.taskQueue.add({
      ...data,
      type: type.name,
      type_id: type.id,
      task_id: task.id,
    });
  }
}
