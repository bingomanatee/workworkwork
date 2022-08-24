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
import { RecordBufferService } from '../../record-buffer/record-buffer.service';
import CovidStateDataDenorm from './CovidStateDataDenorm';
import { QueueManagerService } from '../../queues/queue-manager/queue-manager.service';

const IDENTITY = (input) => input;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};
const MAX_ROW_COUNT = 10000;

const COUNTRY_CSV_URL = 'https://storage.covid19datahub.io/level/1.csv';
const STATE_CSV_URL = 'https://storage.covid19datahub.io/level/2.csv';
const COUNTRY_CSV_FILE_PATH = path.resolve(
  __dirname,
  '../../../../data_files/1.csv',
);
const STATE_CSV_FILE_PATH = path.resolve(
  __dirname,
  '../../../../data_files/2.csv',
);

@Injectable()
export class CsvService {
  pendingCases = [];
  pendingLocations = create(new Map());
  flushedLocations = create(new Map());

  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
    private bufferService: RecordBufferService,
    private queueService: QueueManagerService,
  ) {}

  static processCSV(
    fullPath,
    {
      onError = IDENTITY,
      cast = true,
      onData,
      onEnd = NOOP,
      onRecord = IDENTITY,
    },
  ) {
    const input = parse({
      cast,
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
      } else {
        return;
      }
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
      await this.prismaService.eventForTask(task.id, 'error saving rows', {
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
  async writeCsvRecords(task, type) {
    const { data } = task;
    console.log('----------- WRITE CSV RECORDS FOR ', data.type, '----------');
    switch (data.type) {
      case 'country':
        await this.writeCountryRecords(task);
        break;

      case 'state':
        await this.writeStateRecords(task);
        break;
    }
  }

  private statesByID = create(new Map());

  addState(state, task) {
    if (!this.statesByID.hasKey(state.id)) {
      this.statesByID.set(state.id, state);

      const { prisma } = this.prismaService;
      if (!this.bufferService.buffers.has('state')) {
        this.bufferService.init(
          'state',
          async (data) => {
            return prisma.states.createMany({
              data,
              skipDuplicates: true,
            });
          },
          async (records, err) => {
            console.log('state error: ', err, records);
          },
          100,
        );
      }
      this.bufferService.add('state', state, task);
    }
  }

  private initStateRecordBuffer() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    if (!this.bufferService.buffers.has('state data')) {
      this.bufferService.init(
        'state data',
        async (data, task) => {
          await target.prismaService.prisma.covid_state.createMany({
            data,
            skipDuplicates: true,
          });
          await target.queueService.eventForTask(task.id, 'saved records', {
            count: data.length,
          });
        },
        async (data, err, task) => {
          console.log('buffer error:', err);
          await target.queueService.eventForTask(
            task.id,
            'buffer error saving records',
            {
              rows: data.slice(-5),
              message: err.message,
              stack: JSON.stringify(err.stack),
            },
          );
        },
        10000,
      );
    }
  }

  async writeStateRecords(task) {
    if (!fs.existsSync(STATE_CSV_FILE_PATH)) {
      await this.queueService.taskError(task, 'no data file');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    this.initStateRecordBuffer();
    // eslint-disable-next-line @typescript-eslint/no-this-alias

    console.log('writeStateRecords ', STATE_CSV_FILE_PATH);

    // await this.prismaService.prisma.covid_data_denormalized.deleteMany({});
    let badDataCount = 0;
    let error = null;
    let rows = 0;
    await this.prismaService.prisma.covid_state.deleteMany({});
    await CsvService.processCSV(STATE_CSV_FILE_PATH, {
      cast: false,
      onRecord(input) {
        const { date, id } = input;
        if (!(date && id)) {
          badDataCount += 1;
          console.log('bad input: ', input);
          return null;
        }
        try {
          const denorm = new CovidStateDataDenorm(input);
          return {
            state_data: CovidStateDataDenorm.toJSON(denorm),
            state: CovidStateDataDenorm.toState(denorm),
          };
        } catch (err) {
          console.log('state denorm error:', input, err);
          return null;
        }
      },
      async onData(row) {
        if (!((rows + badDataCount) % 5000)) {
          console.log(rows, 'rows, ', badDataCount, 'bad');
        }
        if (!row) {
          ++badDataCount;
          return;
        }
        ++rows;
        const { state_data, state } = row;
        target.bufferService.add('state data', state_data, task);
        target.addState(state, task);
      },
      async onEnd() {
        if (!error) {
          await target.queueService.eventForTask(task.id, 'csv read', {
            rows: target.pendingRecords.length,
          });
          await target.bufferService.flush('state data', task);
          await target.bufferService.flush('state', task);
          target.queueService.eventForTask(task.id, 'finished csv file', {
            rows,
            badDataCount,
          });
          target.queueService.finishTask(task);

          const { task: hexTask, type: hexType } =
            await target.prismaService.makeTask(
              'localize states to hexes',
              {},
              task.id,
            );
          await target.queueService.addTaskToQueue(hexType, hexTask);
        }
      },
      async onError(err) {
        if (!error) {
          error = err;
          await target.queueService.eventForTask(task.id, 'csv error', {
            message: err.message,
          });

          target.queueService.finishTask(task, 'error');
        }
      },
    });
  }

  private initCountryRecordBuffer() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    if (!this.bufferService.buffers.has('country data')) {
      this.bufferService.init(
        'country data',
        async (data, task) => {
          await this.prismaService.prisma.covid_data_denormalized.createMany({
            data,
            skipDuplicates: true,
          });
          await target.queueService.eventForTask(task.id, 'saved records', {
            count: data.length,
          });
        },
        async (data, err, task) => {
          console.log('buffer error:', err);
          await target.queueService.eventForTask(
            task.id,
            'buffer error saving records',
            {
              rows: data.slice(-5),
              message: err.message,
              stack: JSON.stringify(err.stack),
            },
          );
        },
        10000,
      );
    }
  }

  async writeCountryRecords(task) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    if (!fs.existsSync(COUNTRY_CSV_FILE_PATH)) {
      await this.queueService.taskError(task, 'no datafile');
      return;
    }
    this.initCountryRecordBuffer();
    console.log('write country records ', COUNTRY_CSV_FILE_PATH);

    let badDataCount = 0;
    const error = null;
    let rows = 0;
    await CsvService.processCSV(COUNTRY_CSV_FILE_PATH, {
      onRecord(input) {
        const { date, iso_alpha_3 } = input;
        if (!(date && iso_alpha_3)) {
          badDataCount += 1;
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
        target.bufferService.add('country data', row, task);
      },
      async onEnd() {
        if (!error) {
          await target.bufferService.flush('country data', task);
          await target.queueService.eventForTask(task.id, 'finished csv file', {
            rows,
            badDataCount,
          });
          await target.queueService.finishTask(task);

          await target.queueService.enqueue(
            'create pivot records',
            { level: 'country' },
            {},
            task.parent_task_id,
          );
        }
      },
      async onError(err) {
        await target.queueService.taskError(task, err, 'csv error');
      },
    });
  }

  public fetchStateSsvData(task) {
    console.log('--- fetching data files');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    axios({
      method: 'get',
      url: STATE_CSV_URL,
      responseType: 'stream',
    })
      .then(function (response) {
        const targetStream = fs.createWriteStream(STATE_CSV_FILE_PATH);
        targetStream.on('finish', async () => {
          await target.queueService.finishTask(task);
          await target.queueService.enqueue(
            'write csv records',
            { type: 'state' },
            {},
            task.id,
          );
        });
        targetStream.on('error', async (err) => {
          await target.queueService.taskError(task, err);
        });
        response.data.pipe(targetStream);
      })
      .catch((err) => target.queueService.taskError(task, err));
  }

  public fetchCountryCsvData(task) {
    console.log('--- fetching country data');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this;
    axios({
      method: 'get',
      url: COUNTRY_CSV_URL,
      responseType: 'stream',
    })
      .then(function (response) {
        const targetStream = fs.createWriteStream(COUNTRY_CSV_FILE_PATH);
        targetStream.on('finish', async () => {
          await target.queueService.finishTask(task);

          await target.queueService.enqueue(
            'write csv records',
            {
              type: 'country',
            },
            {},
            task.id,
          );
        });
        targetStream.on('error', async (err) => {
          await target.queueService.taskError(task, err, 'file write failure');
        });
        response.data.pipe(targetStream);
      })
      .catch(async (err) => {
        await target.queueService.taskError(task, err, 'axios failure');
      });
  }
}
