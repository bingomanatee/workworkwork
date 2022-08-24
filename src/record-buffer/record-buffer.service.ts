import { Injectable } from '@nestjs/common';

type recordHandler = (records: any[], task?) => Promise<void>;
type errorHandler = (records: any[], error: Error, task) => Promise<void>;
const DEFAULT_MAX = 10000;

class BufferSet {
  records = [];
  name: string;
  onSaveRecords: recordHandler;
  onError: errorHandler;
  status = 'ready';
  max = DEFAULT_MAX;

  constructor(
    name: 'string',
    writer: recordHandler,
    onError: errorHandler,
    max = DEFAULT_MAX,
  ) {
    this.name = name;
    this.onSaveRecords = writer;
    this.onError = onError;
    this.max = max;
  }

  add(record, task) {
    this.records.push(record);
    if (this.records.length >= this.max && this.status !== 'saving') {
      this.save(task);
    }
  }
  saves = 0;
  async save(task, saveId = null, lastEndTime = 0) {
    if (saveId === null) {
      this.saves += 1;
      saveId = this.saves;
    }
    if (this.status === 'saving') {
      console.log(saveId, 'interrupted save - thread in process', this.name);
      return;
    }

    if (!this.records.length) {
      console.log(saveId, 'no records to save', this.name);
      return;
    }

    this.status = 'saving';

    const start = Date.now();
    if (lastEndTime) {
      console.log('time between ticks: ', start - lastEndTime);
    }
    const toSave = this.records.splice(0, Math.max(1, this.max));
    try {
      await this.onSaveRecords(toSave, task);
      console.log(saveId, ' saved ', toSave.length, 'records');
    } catch (error) {
      this.onError(toSave, error as Error, task);
      console.log(saveId, 'buffer error: ', error);
    }
    const endTime = Date.now();
    console.log(saveId, 'ms per record: ', (endTime - start) / toSave.length);
    this.status = 'ready';
    if (this.records.length > this.max) {
      console.log(saveId, 'next tick for more records');
      process.nextTick(() => {
        console.log('nextTick - saving more', this.name);
        this.save(task, saveId, endTime);
      });
    } else {
      console.log(saveId, 'end of save', this.name, 'no records to save');
    }
  }
}

@Injectable()
export class RecordBufferService {
  buffers = new Map<string, BufferSet>();

  init(name, writer, onError: errorHandler, max = DEFAULT_MAX) {
    this.buffers.set(name, new BufferSet(name, writer, onError, max));
  }

  add(name, record, task) {
    if (!this.buffers.has(name)) {
      throw new Error('No buffer for ' + name);
    }
    this.buffers.get(name).add(record, task);
  }

  async flush(name, task) {
    if (!this.buffers.has(name)) {
      throw new Error('No buffer for ' + name);
    }
    await this.buffers.get(name).save(task);
  }
}
