// @ts-ignore
import { Bounds } from './geometry/Bounds';

export class Point implements ll {
  constructor(pt: ll) {
    const { lt, ln } = pt;
    this.lt = lt;
    this.ln = ln;
  }

  lt = 0;
  ln = 0;

  valueOf() {
    return { lt: this.lt, ln: this.ln };
  }

  toString() {
    return `${this.lt},${this.ln}`;
  }

  toJSON() {
    return this.valueOf();
  }
}

export class Shape {
  constructor(parent: any, points: ll[]) {
    this.parent = parent;
    this.points = points;
  }

  get points(): ll[] {
    return this._points;
  }

  set points(value: ll[]) {
    this._points = value.map((pt) => new Point(pt).valueOf());
  }

  parent: any;
  private _points: ll[] = [];

  get width() {
    const { min, max } = this._points.reduce(
      (memo, pt) => {
        if (pt.ln < memo.min) {
          memo.min = pt.ln;
        }
        if (pt.ln > memo.max) {
          memo.max = pt.ln;
        }
        return memo;
      },
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );
    return max - min;
  }

  get boundary() {
    const bounds = new Bounds(this.points[0]);
    this.points.forEach((pt) => bounds.include(pt));
    return bounds;
  }

  toString() {
    return this.points.map((p) => p.toString()).join(' ');
  }
}

export type ll = {
  lt: number;
  ln: number;
};

export type bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};
