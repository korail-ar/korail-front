export const wrap = degrees => (degrees % 360 + 360) % 360;
export const difference = (a, b) => ((a - b + 540) % 360) - 180;
export class HeadingEstimator {
  constructor() { this.reset(); }
  reset() { this.reference = null; this.mapReference = null; this.last = null; this.absolute = false; this.pendingTurn = false; }
  sample(event, screenAngle = 0) {
    const alpha = Number.isFinite(event.webkitCompassHeading) ? event.webkitCompassHeading : Number.isFinite(event.alpha) ? 360 - event.alpha : null;
    if (alpha === null) return null;
    this.last = wrap(alpha + screenAngle);
    this.absolute = Number.isFinite(event.webkitCompassHeading) || event.absolute === true;
    return this.last;
  }
  calibrate(mapHeading) { if (this.last === null) return false; this.reference = this.last; this.mapReference = wrap(mapHeading); this.pendingTurn = false; return true; }
  calibrateAbsolute(mapOffset) { if (!this.absolute || this.last === null || !Number.isFinite(mapOffset)) return false; this.reference = 0; this.mapReference = wrap(mapOffset); this.pendingTurn = false; return true; }
  get heading() { return this.reference === null || this.last === null ? null : wrap(this.mapReference + difference(this.last, this.reference)); }
  get rotation() { return this.reference === null || this.last === null ? null : difference(this.last, this.reference); }
}
