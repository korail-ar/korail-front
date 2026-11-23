export class PdrEngine {
  constructor() { this.reset(); }
  reset(point = null) { this.point = point && { ...point }; this.steps = 0; this.mapSteps = 0; this.directionalSteps = 0; this.distanceM = 0; this.eastM = 0; this.northM = 0; this.uncertaintyM = 1; this.history = []; }
  step({ heading, compassHeading = null, strideM, pixelsPerMeter, timestamp, source, uncertaintyExtraM = 0 }) {
    this.steps++; this.distanceM += strideM; this.uncertaintyM += 0.12 * strideM + uncertaintyExtraM;
    if (Number.isFinite(compassHeading)) { const radians = compassHeading * Math.PI / 180; this.eastM += strideM * Math.sin(radians); this.northM += strideM * Math.cos(radians); this.directionalSteps++; }
    if (this.point && Number.isFinite(heading) && Number.isFinite(pixelsPerMeter) && pixelsPerMeter > 0) {
      const radians = heading * Math.PI / 180;
      this.point = { x: this.point.x + strideM * pixelsPerMeter * Math.sin(radians), y: this.point.y - strideM * pixelsPerMeter * Math.cos(radians) };
      this.mapSteps++;
    }
    const record = { timestamp, steps: this.steps, mapSteps: this.mapSteps, directionalSteps: this.directionalSteps, distanceM: this.distanceM, heading, compassHeading, eastM: this.eastM, northM: this.northM, pdrPoint: this.point && { ...this.point }, uncertaintyM: this.uncertaintyM, source };
    this.history.push(record);
    return record;
  }
}
