export class StepDetector {
  constructor({ sensitivity = 1, minInterval = 300, maxInterval = 1200 } = {}) {
    Object.assign(this, { sensitivity, minInterval, maxInterval });
    this.reset();
  }
  reset() { this.baseline = null; this.filtered = 0; this.peak = 0; this.peakAt = 0; this.lastStep = 0; this.lastSample = null; this.candidates = 0; this.peakCount = 0; this.sampleCount = 0; }
  push({ x, y, z, includesGravity = false, timestamp }) {
    if (![x, y, z, timestamp].every(Number.isFinite)) return { step: false, signal: 0, valid: false };
    const magnitude = Math.hypot(x, y, z);
    const dt = this.lastSample === null ? 0.02 : Math.max(0.001, Math.min(0.2, (timestamp - this.lastSample) / 1000));
    this.lastSample = timestamp;
    this.sampleCount++;
    // Remove the changing baseline for both sensor variants. The magnitude of
    // gravity-free acceleration is positive even between walking peaks.
    if (this.baseline === null) this.baseline = magnitude;
    const dynamic = magnitude - this.baseline;
    this.baseline += Math.min(1, dt / (includesGravity ? 0.8 : 0.6)) * dynamic;
    this.filtered += Math.min(1, dt / 0.08) * (dynamic - this.filtered);
    const signal = this.filtered;
    const threshold = 0.25 * this.sensitivity;
    if (signal > threshold && signal > this.peak) { this.peak = signal; this.peakAt = timestamp; }
    let step = false;
    if (this.peak > threshold && signal < 0) {
      this.peakCount++;
      const gap = this.lastStep ? this.peakAt - this.lastStep : 0;
      if (!this.lastStep || gap >= this.minInterval && gap <= this.maxInterval) {
        this.candidates++;
        // Two periodic peaks establish walking. A single shake is never a step.
        step = this.candidates >= 2;
      } else if (gap > this.maxInterval) this.candidates = 1;
      this.lastStep = this.peakAt;
      this.peak = 0;
    }
    if (this.lastStep && timestamp - this.lastStep > this.maxInterval) this.candidates = 0;
    return { step, signal, magnitude, baseline: this.baseline, peakCount: this.peakCount, stationary: !this.lastStep || timestamp - this.lastStep > this.maxInterval, valid: true };
  }
}
