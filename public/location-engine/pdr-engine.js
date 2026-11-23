export class PdrEngine {
  constructor() { this.reset(); }
  reset(point = null) { this.point = point && { ...point }; this.steps = 0; this.distanceM = 0; this.uncertaintyM = 1; this.history = []; }
  step({ heading, strideM, pixelsPerMeter, timestamp, source }) {
    this.steps++; this.distanceM += strideM; this.uncertaintyM += 0.12 * strideM;
    if (this.point && Number.isFinite(heading) && Number.isFinite(pixelsPerMeter) && pixelsPerMeter > 0) {
      const radians = heading * Math.PI / 180;
      this.point = { x: this.point.x + strideM * pixelsPerMeter * Math.sin(radians), y: this.point.y - strideM * pixelsPerMeter * Math.cos(radians) };
    }
    const record = { timestamp, steps: this.steps, distanceM: this.distanceM, heading, pdrPoint: this.point && { ...this.point }, uncertaintyM: this.uncertaintyM, source };
    this.history.push(record);
    return record;
  }
}
