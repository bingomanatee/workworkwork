import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { CsvService } from '../../src/tasks/csv/csv.service';
import * as path from 'path';

async function main() {
  return new Promise((done, fail) => {
    const data = path.resolve(__dirname, 'task_types.csv');
    const types = [];
    CsvService.processCSV(data, {
      onData(row) {
        types.push(row);
      },
      onEnd() {
        prisma.task_type
          .createMany({
            data: types,
            skipDuplicates: true,
          })
          .catch(fail)
          .then(done);
      },
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
