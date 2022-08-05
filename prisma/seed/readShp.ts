import * as fs from 'fs';
// @ts-ignore
import shp from 'shpjs';
import Country from './../../src/Country';

const buf = fs.readFileSync(__dirname + '/TM_WORLD_BORDERS_SIMPL-0.3.zip');
shp(buf).then((geo: any) => {
  // @ts-ignore
  geo.features.forEach(({ geometry, properties }) => {
    /*      console.log('properties:', properties);
    console.log('country:', properties.NAME);
    console.log('boundries:', geometry.bbox);
    console.log('coordinates:', geometry.coordinates);
    console.log('------');*/
    const country = new Country(properties, geometry);
    console.log('country: ', JSON.stringify(country.toJSON()).substring(0, 100), 'props', properties);
  });
});
