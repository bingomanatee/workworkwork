// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as _ from 'lodash';
const prisma = new PrismaClient();
import * as fs from 'fs';
// @ts-ignore
import * as shp from 'shpjs';

import { getRes0Cells, cellToChildren } from 'h3-js';
const locations = require('./locations.json');
const types = require('./types.json');
// @ts-ignore
import Hex from '../../src/hexes/Hex';
import Country from '../../src/Country';

async function main() {
  return new Promise(async (done, fail) => {
    /*
   const types = await prisma.task_type.findMany({});
   console.log('task types:', types)
   fs.writeFileSync(__dirname + '/types.json', JSON.stringify(types));
*/
    await prisma.task_type.createMany({
      data: types,
      skipDuplicates: true,
    });
    console.log('saved task types');

    await prisma.covid_location.createMany({
      data: locations,
      skipDuplicates: true,
    });
    console.log('saved locations');

    const hexes = getRes0Cells().map((hindex) => ({
      hindex,
      level: 0,
    }));
    const fullHexes = [];
    hexes.forEach((hex) => {
      const childIndexes = cellToChildren(hex.hindex, 2);
      childIndexes.forEach((hindex) => {
        fullHexes.push({ hindex, level: 2 });
      });
    });
    const hexData = [...hexes, ...fullHexes].map((c) => new Hex(c).toJSON());

    await prisma.hexes.deleteMany({});
    await prisma.hexes.createMany({
      data: hexData,
      skipDuplicates: true,
    });
    console.log('saved hexes');

    const buf = fs.readFileSync(__dirname + '/TM_WORLD_BORDERS_SIMPL-0.3.zip');

    await shp(buf).then(async (geo: any) => {
      await prisma.$queryRaw`TRUNCATE TABLE public.\"countries\" CASCADE;`;
      const countries = [];
      const shapes = [];
      // @ts-ignore
      geo.features.forEach(({ geometry, properties }) => {
        const country = new Country(properties, geometry);
        if (Math.random() < 0.1) console.log('country: ', properties);
        countries.push(country.toJSON());
        country.shapes().forEach((shape) => {
          shapes.push(shape);
        });
      });
      const chunks = _.chunk(countries, 10);
      for (const chunk of chunks) {
        try {
          await prisma.countries.createMany({
            data: chunk,
            skipDuplicates: true,
          });
        } catch (err) {
          console.log('error with chunk', chunk, err.message);
        }
      }

      const shapeChunks = _.chunk(shapes, 100);

      for (const chunk of shapeChunks) {
        await prisma.country_shape.createMany({
          data: chunk,
        });
        console.log('saved 100 shapes');
      }
      console.log('saved all shapes');
    });

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
