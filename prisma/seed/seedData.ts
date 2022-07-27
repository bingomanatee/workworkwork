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
        row.deleted = row.deleted === 't';
        types.push(row);
      },
      onEnd() {
        const noParentTypes = types.map((type) => ({
          ...type,
          parent_id: null,
        }));
        prisma.task_type
          .createMany({
            data: noParentTypes,
            skipDuplicates: true,
          })
          .catch(fail)
          .then(() => {
            Promise.all(
              types.map((type) => {
                prisma.task_type.update({
                  where: { id: type.id },
                  data: type,
                });
              }),
            ).catch(fail);
          });
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
