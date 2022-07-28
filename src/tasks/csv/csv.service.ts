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

const IDENTITY = (input) => input;
const FLUSH_INTERVAL = 1000;
const MESSAGE_INTERVAL = 10;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

@Injectable()
export class CsvService {
  pendingCases = [];
  pendingLocations = create(new Map());
  flushedLocations = create(new Map());

  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  initQueues() {
    this.pendingCases = [];
    this.pendingLocations = create(new Map());
    this.flushedLocations = create(new Map());
  }

  async writeCsvRecords(task: task) {
    this.initQueues();
    const fullPath = path.resolve(
      __dirname,
      `../../../../data_files/${task.data['filePath']}`,
    );

    console.log('write csv records from ', fullPath);

    const target = this;
    let rowCount = 0;
    const onRecord = (record) => new CaseRow(record);

    const onError = async (err) => {
      await this.prismaService.eventForTask(task.id, 'error in sql', {
        message: err.message,
      });
      await target.prismaService.eventForTask(task.id, 'error', {
        message: err.message,
      });
      await target.prismaService.finishTask(task, 'error');
    };

    const onEnd = async () => {
      await this.prismaService.eventForTask(task.id, 'row count', {
        rowCount,
      });
      await target.flushRows(task);
      await target.prismaService.finishTask(task);
    };

    const onData = (row) => {
      //@TODO: write to database
      // at this point we are just running over the rows
      // and incrementing the count
      ++rowCount;
      if (!(rowCount % FLUSH_INTERVAL)) {
        target.flushRows(task);
      }
      target.pushRow(row, task);
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

  pushRow(row: CaseRow, task) {
    if (task.data.skipData !== true) this.pendingCases.push(row.case);
    if (task.data.skipLocation !== true) {
      const location = row.location;
      // @ts-ignore
      if (!this.flushedLocations.hasKey(location.uid)) {
        // @ts-ignore
        this.pendingLocations.set(location.uid, location);
      }
    }
  }

  messageInterval = 0;

  private async flushRows(task) {
    ++this.messageInterval;
    await this.flushLocations(task, !(this.messageInterval % MESSAGE_INTERVAL));
    await this.flushCases(task, !(this.messageInterval % MESSAGE_INTERVAL));
  }

  private async flushLocations(task, message) {
    if (this.pendingLocations.size < 1) {
      return;
    }
    this.pendingLocations.forEach((loc, id) => {
      this.flushedLocations.set(id, loc);
    });

    const locations = this.pendingLocations.items;
    this.pendingLocations.clear();

    this.writeQueue.push({
      type: 'locations',
      locations,
      task,
      message,
    });
  }

  async processLocations({ locations, message, task }) {
    await this.prismaService.prisma.covid_location
      .createMany({
        data: locations,
        skipDuplicates: true,
      })
      .catch((err) => {
        return this.prismaService.eventForTask(
          task.id,
          'error in flushing locations',
          {
            message: err.message,
            first: this.pendingLocations.firstItem,
            last: this.pendingLocations.lastItem,
          },
        );
      });

    if (message) {
      await this.prismaService.eventForTask(task.id, 'flushing locations', {
        first: this.pendingLocations.firstItem,
        last: this.pendingLocations.lastItem,
      });
    }
  }

  private async flushCases(task, message) {
    const cases = create(this.pendingCases).sort((c1, c2) => {
      return c1.id - c2.id;
    });
    this.pendingCases = [];
    if (cases.size < 1) {
      return;
    }

    this.writeQueue.push({
      type: 'cases',
      data: {
        cases,
        task,
        message,
      },
    });
  }

  writeQueue = [];
  processQueue = new Set();
  @Cron('*/5 * * * * *')
  async clearWriteQueue() {
    if (this.writeQueue.length && this.processQueue.size < 3) {
      const job = this.writeQueue.pop();

      this.processQueue.add(job);

      try {
        switch (job.type) {
          case 'cases':
            await this.processCases(job.data);
            break;

          case 'locations':
            await this.processLocations(job.data);
            break;

          default:
            console.log('unknown job type', job);
        }
      } catch (err) {
        console.log('error processing job: ', err, job);
      }

      this.processQueue.delete(job);
    }
  }

  async processCases({ cases, task, message }) {
    const caseMap = create(
      cases.reduce((m, data) => {
        m.set(data.id, data);
        return m;
      }, new Map()),
    );

    const [minId, maxId] = cases.reduce(
      (m, covidCase) => {
        if (m[0] > covidCase.id) {
          m[0] = covidCase.id;
        }
        if (m[1] < covidCase.id) {
          m[1] = covidCase.id;
        }
        return m;
      },
      [Number.MAX_VALUE, 0],
    );

    try {
      const relativeIDs = await this.prismaService.prisma.covid_stats.findMany({
        where: {
          AND: [{ id: { gte: minId } }, { id: { lte: maxId } }],
        },
        select: {
          id: true,
          date_published: true,
          last_update: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      relativeIDs.forEach((record) => {
        caseMap.deleteKey(record.id);
      });
    } catch (err) {
      await this.prismaService.eventForTask(
        task.id,
        'error in reduction query',
        {
          minId,
          maxId,
          message: err.message,
        },
      );
    }

    if (caseMap.size < 1) {
      if (message) {
        await this.prismaService.eventForTask(
          task.id,
          'all cases already saved',
          {
            minId,
            maxId,
          },
        );
      }
      return;
    }

    const first = cases.firstItem;
    const last = cases.lastItem;

    if (message) {
      await this.prismaService.eventForTask(task.id, 'flushing cases', {
        first,
        last,
      });
    }
    await this.prismaService.prisma.covid_stats
      .createMany({
        data: caseMap.items,
        skipDuplicates: true,
      })
      .catch((err) => {
        return this.prismaService.eventForTask(
          task.id,
          'error in flushing rows',
          {
            message: err.message,
            first,
            last,
          },
        );
      });
  }

  taskTest() {
    const fullPath = path.resolve(
      __dirname,
      `../../../../data_files/CSSE_DailyReports.csv`,
    );

    console.log('--------------- testing ', fullPath, ' ----------');
    let rowCount = 0;
    const onRecord = (record) => {
      const out = new CaseRow(record);
      console.log('record', record, 'translated to ', out.location);
      return out;
    };

    const onError = (err) => {
      console.log('error', err);
    };

    const onEnd = () => {
      console.log('---------------test done ----------');
    };

    const onData = (row) => {
      //@TODO: write to database
      // at this point we are just running over the rows
      // and incrementing the count
      ++rowCount;
      if (rowCount > 100) {
        throw new Error('stopping after 100');
      }
    };

    CsvService.processCSV(fullPath, {
      onData,
      onEnd,
      onError,
      onRecord,
    });
  }
}
