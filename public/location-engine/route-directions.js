import { bearingOnMap } from './map-orientation.js';
import { cardinal, difference, wrap } from './heading-estimator.js';

export function routeSegments(points, compassOffset) {
  if (!Number.isFinite(compassOffset)) return [];
  const segments = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i], length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length < 0.01) continue;
    const bearing = wrap(bearingOnMap(from, to) - compassOffset);
    segments.push({ from, to, length, bearing, cardinal: cardinal(bearing), index: i - 1 });
  }
  return segments;
}

export function nearbyRouteDirection(segments, point, compassBearing) {
  if (!segments.length || !point || !Number.isFinite(compassBearing)) return null;
  const candidates = segments.map(segment => {
    const dx = segment.to.x - segment.from.x, dy = segment.to.y - segment.from.y;
    const t = Math.max(0, Math.min(1, ((point.x - segment.from.x) * dx + (point.y - segment.from.y) * dy) / (segment.length ** 2)));
    const distance = Math.hypot(point.x - segment.from.x - t * dx, point.y - segment.from.y - t * dy);
    return { ...segment, distance, t, angleDifference: Math.abs(difference(compassBearing, segment.bearing)) };
  }).sort((a, b) => a.distance - b.distance);
  const nearest = candidates[0];
  // A turn may happen at the shared end of two segments. Do not treat it as an exit.
  const atJunction = candidates.filter(candidate => candidate.distance <= nearest.distance + 5 && Math.abs(candidate.index - nearest.index) <= 1);
  return atJunction.sort((a, b) => a.angleDifference - b.angleDifference)[0] || nearest;
}

export class DirectionTracker {
  constructor() { this.reset(); }
  reset() { this.mismatchStreak = 0; this.alignedStreak = 0; this.status = '방향 관측 대기'; }
  observe({ segments, point, compassBearing, accuracyDegrees }) {
    if (!Number.isFinite(compassBearing) || !segments.length || accuracyDegrees !== null && accuracyDegrees > 25) return { status: '방향 판단 보류', mismatchStreak: this.mismatchStreak, expected: null };
    const expected = nearbyRouteDirection(segments, point, compassBearing);
    if (!expected) return { status: '방향 판단 보류', mismatchStreak: this.mismatchStreak, expected: null };
    if (expected.angleDifference <= 60) { this.alignedStreak++; this.mismatchStreak = 0; this.status = '경로 방향과 대체로 일치'; }
    else if (expected.angleDifference >= 75) { this.mismatchStreak++; this.alignedStreak = 0; this.status = this.mismatchStreak >= 3 ? '경로 이탈 의심 · 방향 불일치 지속' : '경로 방향과 다를 수 있음'; }
    else this.status = '방향 판단 보류';
    return { status: this.status, mismatchStreak: this.mismatchStreak, expected };
  }
}
