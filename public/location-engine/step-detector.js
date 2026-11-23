export class StepDetector {
  constructor({ sensitivity = 1, minInterval = 300, maxInterval = 1200 } = {}) {
    Object.assign(this, { sensitivity, minInterval, maxInterval });
    this.reset();
  }
  reset() { this.gravity = 0; this.filtered = 0; this.previous = 0; this.peak = 0; this.peakAt = 0; this.lastStep = 0; this.lastSample = 0; this.candidates = 0; }
  push({ x, y, z, includesGravity = false, timestamp }) {
    if (![x, y, z, timestamp].every(Number.isFinite)) return { step: false, signal: 0 };
    const magnitude = Math.hypot(x, y, z);
    const dt = this.lastSample ? Math.max(0, Math.min(1, (timestamp - this.lastSample) / 1000)) : 0.02;
    this.lastSample = timestamp;
    if (includesGravity) this.gravity += Math.min(1, dt / 0.7) * (magnitude - this.gravity);
    const dynamic = includesGravity ? magnitude - this.gravity : magnitude;
    this.filtered += Math.min(1, dt / 0.12) * (dynamic - this.filtered);
    const signal = this.filtered;
    const threshold = 0.7 * this.sensitivity;
    if (signal > threshold && signal > this.peak) { this.peak = signal; this.peakAt = timestamp; }
    let step = false;
    if (this.peak > threshold && signal < threshold * 0.45 && this.previous >= signal) {
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
    this.previous = signal;
    return { step, signal, stationary: !this.lastStep || timestamp - this.lastStep > this.maxInterval };
  }
}
