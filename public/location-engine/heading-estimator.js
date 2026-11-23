export const wrap = degrees => (degrees % 360 + 360) % 360;
export const difference = (a, b) => ((a - b + 540) % 360) - 180;
export const cardinal = degrees => ['북', '동', '남', '서'][Math.round(wrap(degrees) / 90) % 4];
export function cardinalReading(degrees, accuracyDegrees = null) {
  if (!Number.isFinite(degrees)) return '절대 나침반 측정 불가';
  if (accuracyDegrees !== null && (accuracyDegrees < 0 || accuracyDegrees > 25 || accuracyDegrees >= Math.abs(45 - wrap(degrees) % 90))) return `방위 불확실 · ${wrap(degrees).toFixed(0)}° (±${accuracyDegrees.toFixed(0)}°)`;
  return `${cardinal(degrees)} · ${wrap(degrees).toFixed(0)}°${accuracyDegrees === null ? ' (정확도 미제공)' : ` (±${accuracyDegrees.toFixed(0)}°)`}`;
}
export class HeadingEstimator {
  constructor() { this.reset(); }
  reset() { this.reference = null; this.mapReference = null; this.last = null; this.absolute = false; this.accuracyDegrees = null; this.pendingTurn = false; }
  sample(event, screenAngle = 0) {
    const webkitValid = Number.isFinite(event.webkitCompassHeading) && event.webkitCompassAccuracy !== -1;
    const alpha = webkitValid ? event.webkitCompassHeading : Number.isFinite(event.alpha) ? 360 - event.alpha : null;
    if (alpha === null) { this.last = null; this.absolute = false; this.accuracyDegrees = null; return null; }
    this.last = wrap(alpha + screenAngle);
    this.absolute = webkitValid || event.absolute === true;
    this.accuracyDegrees = webkitValid && Number.isFinite(event.webkitCompassAccuracy) && event.webkitCompassAccuracy >= 0 ? event.webkitCompassAccuracy : null;
    return this.last;
  }
  calibrate(mapHeading) { if (this.last === null) return false; this.reference = this.last; this.mapReference = wrap(mapHeading); this.pendingTurn = false; return true; }
  calibrateAbsolute(mapOffset) { if (!this.absolute || this.last === null || !Number.isFinite(mapOffset)) return false; this.reference = 0; this.mapReference = wrap(mapOffset); this.pendingTurn = false; return true; }
  get heading() { return this.reference === null || this.last === null ? null : wrap(this.mapReference + difference(this.last, this.reference)); }
  get rotation() { return this.reference === null || this.last === null ? null : difference(this.last, this.reference); }
}

export class WalkingHeadingGate {
  constructor() { this.reset(); }
  reset() { this.candidate = null; this.streak = 0; }
  observe(heading) {
    if (!Number.isFinite(heading)) { this.reset(); return false; }
    if (this.candidate === null || Math.abs(difference(heading, this.candidate)) > 20) { this.candidate = heading; this.streak = 1; }
    else { this.candidate = wrap(this.candidate + difference(heading, this.candidate) * 0.3); this.streak++; }
    return this.streak >= 3;
  }
}
