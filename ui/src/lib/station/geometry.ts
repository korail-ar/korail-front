import { polylineLength, polylineWalkability, segmentWalkability } from './spatial';
import type { MapPoint } from './types';

export interface OptimizedGeometry {
  points: MapPoint[];
  status: 'PASS' | 'FAIL' | 'UNVERIFIED';
  originalLengthUnits: number;
  finalLengthUnits: number;
}

const CLEARANCE_UNITS = 3;
const SAME_POINT_EPSILON = 1e-6;

function deduplicate(points: readonly MapPoint[]): MapPoint[] {
  return points.filter((point, index) => index === 0
    || Math.hypot(point[0] - points[index - 1][0], point[1] - points[index - 1][1])
      > SAME_POINT_EPSILON);
}

/** Preserve floor/portal endpoints and pull only strings proven clear by the SVG polygons. */
export function optimizeFloorGeometry(
  floor: string, sourcePoints: readonly MapPoint[],
): OptimizedGeometry {
  const original = deduplicate(sourcePoints);
  const originalLengthUnits = polylineLength(original);
  const status = polylineWalkability(floor, original);
  if (status !== 'PASS' || original.length < 3) {
    return { points: original, status, originalLengthUnits, finalLengthUnits: originalLengthUnits };
  }

  const points: MapPoint[] = [original[0]];
  let index = 0;
  while (index < original.length - 1) {
    let next = index + 1;
    for (let candidate = original.length - 1; candidate > index + 1; candidate -= 1) {
      if (segmentWalkability(floor, original[index], original[candidate], CLEARANCE_UNITS)
        === 'PASS') {
        next = candidate;
        break;
      }
    }
    points.push(original[next]);
    index = next;
  }
  const finalStatus = polylineWalkability(floor, points, CLEARANCE_UNITS);
  if (finalStatus !== 'PASS') {
    return { points: original, status, originalLengthUnits, finalLengthUnits: originalLengthUnits };
  }
  return {
    points, status: 'PASS', originalLengthUnits,
    finalLengthUnits: polylineLength(points),
  };
}

export function turnAngleDegrees(a: MapPoint, b: MapPoint, c: MapPoint): number {
  const first = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const second = Math.atan2(c[1] - b[1], c[0] - b[0]);
  return ((((second - first) * 180) / Math.PI + 540) % 360) - 180;
}

export function countMeaningfulTurns(points: readonly MapPoint[], thresholdDegrees = 35): number {
  return points.slice(1, -1).reduce((count, point, index) => count
    + Number(Math.abs(turnAngleDegrees(points[index], point, points[index + 2]))
      >= thresholdDegrees), 0);
}
