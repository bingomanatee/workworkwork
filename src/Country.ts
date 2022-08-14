import { ll, Shape, Point, bounds } from './geometry';
import { Bounds } from './geometry/Bounds';

function flatten(list: any[]) {
  const shapes = new Set();

  function tryFlatten(parent: any, list: any) {
    if (Array.isArray(list)) {
      if (typeof list[0] === 'number') {
        // at a point;
        shapes.add(
          parent.map((list: number[]) => {
            const [ln, lt] = list;
            return new Point({ lt, ln });
          }),
        );
      } else {
        list.forEach((subList: any) => {
          tryFlatten(list, subList);
        });
      }
    } else {
      console.log('in list: ', list);
    }
  }

  tryFlatten(null, list);

  return Array.from(shapes.values());
}

type countryPropObj = {
  NAME: string;
  ISO2: string;
  ISO3: string;
  LAT: number;
  LON: number;
  POP2005: number;
};

type geom = {
  coordinates: any[];
};

export default class Country {
  latitude: number;
  longitude: number;
  population: number;
  constructor(prop: countryPropObj, geometry: geom) {
    this.prop = prop;
    this.name = prop.NAME;
    this.iso2 = prop.ISO2;
    this.iso3 = prop.ISO3;
    this.latitude = prop.LAT;
    this.longitude = prop.LON;
    this.population = prop.POP2005 || 0;
    this.geometry = geometry.coordinates;
  }

  toJSON() {
    const boundary = this.boundary;
    return {
      name: this.name,
      iso2: this.iso2,
      iso3: this.iso3,
      latitude: this.latitude,
      longitude: this.longitude,
      population: this.population,
      boundary: [boundary.northWest.toJSON(), boundary.southEast.toJSON()],
    };
  }

  toShapeJSON(shape: Shape, i: number) {
    return {
      index: i,
      boundary: shape.boundary,
      country_iso3: this.iso3,
      points: { shape: shape.points },
    };
  }

  // @ts-ignore
  shapes() {
    return this.geometry
      .map((shape, index) => {
        return this.toShapeJSON(shape, index);
      })
  }

  get geometry(): any[] {
    return this._geometry;
  }

  set geometry(coordinates: any[]) {
    try {
      this._geometry = Array.from(
        flatten(coordinates)
          .map(
            // @ts-ignore
            (points: ll[]) => new Shape(this, points),
          )
          .reduce((map, shape) => {
            map.set(shape.toString(), shape);
            return map;
          }, new Map())
          .values(),
      );
    } catch (err) {
      // @ts-ignore
      console.log('cannot read geometry ', coordinates, err.message);
    }
  }

  private _geometry: any[] = [];

  prop: countryPropObj;
  name: string;
  iso2: string;
  iso3: string;

  get boundary() {
    let boundary = new Bounds({ lt: this.latitude, ln: this.longitude });
    this.shapes().forEach((shape) => {
      if (boundary) {
        boundary = boundary.union(shape.boundary);
      } else {
        boundary = shape.boundary;
      }
    });
    return boundary;
  }
}
