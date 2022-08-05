// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import * as fs from 'fs';

import { CsvService } from '../../src/tasks/csv/csv.service';
import * as path from 'path';
import { getRes0Cells, cellToChildren } from 'h3-js';
// @ts-ignore
import Hex from '../../src/hexes/Hex';

async function main() {
  return new Promise(async (done, fail) => {
    const data = await prisma.covid_location.findMany({});
    fs.writeFileSync(__dirname + '/locations.json', JSON.stringify(data));
    const types = await prisma.task_type.findMany({});
    fs.writeFileSync(__dirname + '/types.json', JSON.stringify(types));
    done(true);
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
