import { bounds, ll, Point } from '../geometry';

export class Bounds implements bounds {
  constructor(pt?: ll, pt2?: ll) {
    if (pt) {
      this.include(pt);
    }
    if (pt2) {
      this.include(pt2);
    }
  }

  include(pt: ll) {
    this.east = Math.max(pt.ln, this.east);
    this.west = Math.min(pt.ln, this.west);
    this.north = Math.max(pt.lt, this.north);
    this.south = Math.min(pt.lt, this.south);
  }

  union(b: Bounds): Bounds {
    const newBounds = new Bounds(this.northWest, this.southEast);
    newBounds.include(b.southEast);
    newBounds.include(b.northWest);
    return newBounds;
  }

  east: number = Number.MIN_SAFE_INTEGER;
  south: number = Number.MAX_SAFE_INTEGER;
  north: number = Number.MIN_SAFE_INTEGER;
  west: number = Number.MAX_SAFE_INTEGER;

  get northWest() {
    return new Point({ ln: this.west, lt: this.north });
  }

  get southEast() {
    return new Point({ ln: this.east, lt: this.south });
  }

  get center() {
    return new Point({
      lt: (this.north + this.south) / 2,
      ln: (this.east + this.west) / 2,
    });
  }
}
