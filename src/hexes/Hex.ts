/* eslint-disable no-param-reassign */
import { cellToBoundary, cellToLatLng } from 'h3-js';
// @ts-ignore
import round from 'round-tofixed';
import { ll, Point, Shape } from '../geometry';

type hexConst = {
  hindex: string;
  level: number;
};

export default class Hex {
  get boundary(): ll[] {
    return this._boundary;
  }

  set boundary(value: ll[]) {
    this._boundary = value.map((pt) => new Point(pt).valueOf());
  }
  constructor(params: hexConst) {
    const { hindex, level } = params;
    this.hindex = hindex;
    this.boundary = cellToBoundary(hindex).map(([lt, ln]) => ({
      lt,
      ln,
    }));
    this.center = cellToLatLng(hindex);
    this.level = level || 0;
  }

  hindex: string;
  private _boundary: ll[] = [];
  center: number[];
  level: number;

  toJSON() {
    const [lt, ln] = this.center;
    const { _boundary, ps } = this;
    return {
      hindex: this.hindex,
      boundary: this._boundary,
      shapes: this.shapes(_boundary, ps).map((s) => ({ points: s.points })),
      level: this.level,
      latitude: lt,
      longitude: ln,
    };
  }

  get ps() {
    return this._boundary.map((pt: ll) => {
      if (pt.ln < -45) {
        return 'l';
      }
      if (pt.ln > 45) {
        return 'r';
      }
      return 'c';
    });
  }

  leftShape(boundary: ll[], ps: string[]) {
    const points = boundary.map((pt, i) => {
      const side = this.ps[i];
      if (side === 'r') {
        return { ...pt, ln: pt.ln - 360 };
      }
      return pt;
    });

    return new Shape(this, points);
  }

  rightShape(boundary: ll[], ps: string[]) {
    const points = boundary.map((pt: ll, i) => {
      const side = ps[i];
      if (side === 'l') {
        return { ...pt, lt: pt.lt + 360 };
      }
      return pt;
    });

    return new Shape(this, points);
  }

  shapes(boundary: ll[], ps: string[]): Shape[] {
    const psSet = new Set(ps);
    if (psSet.has('l') && psSet.has('r')) {
      return [this.leftShape(boundary, ps), this.rightShape(boundary, ps)];
    }
    return [new Shape(this, boundary)];
  }
}
