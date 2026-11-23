export const wrap = degrees => (degrees % 360 + 360) % 360;
export const difference = (a, b) => ((a - b + 540) % 360) - 180;
export class HeadingEstimator {
  constructor() { this.reset(); }
  reset() { this.reference = null; this.mapReference = null; this.last = null; this.pendingTurn = false; }
  sample(event, screenAngle = 0) {
    const alpha = Number.isFinite(event.webkitCompassHeading) ? event.webkitCompassHeading : Number.isFinite(event.alpha) ? 360 - event.alpha : null;
    if (alpha === null) return null;
    this.last = wrap(alpha + screenAngle);
    return this.last;
  }
  calibrate(mapHeading) { if (this.last === null) return false; this.reference = this.last; this.mapReference = wrap(mapHeading); this.pendingTurn = false; return true; }
  get heading() { return this.reference === null || this.last === null ? null : wrap(this.mapReference + difference(this.last, this.reference)); }
  get rotation() { return this.reference === null || this.last === null ? null : difference(this.last, this.reference); }
}
