/** Counts plausible walking pulses from gravity-including acceleration magnitude. This is an estimate, not a platform pedometer. */
export function createStepDetector() {
  let baseline = null, armed = true, lastStep = -Infinity, lastEvent = -Infinity;
  return (magnitude, now = Date.now()) => {
    if (!Number.isFinite(magnitude) || magnitude < 0) return false;
    if (now - lastEvent > 2000) { baseline = magnitude; armed = true; }
    lastEvent = now;
    baseline = baseline == null ? magnitude : baseline * 0.9 + magnitude * 0.1;
    const pulse = magnitude - baseline;
    if (pulse < 0.25) armed = true;
    if (armed && pulse > 1.15 && now - lastStep >= 300) { armed = false; lastStep = now; return true; }
    return false;
  };
}

export function routePointAtMeters(route, meters) {
  if (!route?.segments?.length || !Number.isFinite(meters) || meters < 0) return null;
  let remaining = meters;
  for (const segment of route.segments) {
    if (!Number.isFinite(segment.meters) || segment.meters < 0) return null;
    if (segment.meters === 0) continue;
    if (remaining <= segment.meters) {
      const t = remaining / segment.meters;
      return { x: segment.from.x + (segment.to.x - segment.from.x) * t, y: segment.from.y + (segment.to.y - segment.from.y) * t };
    }
    remaining -= segment.meters;
  }
  return route.points.at(-1);
}
