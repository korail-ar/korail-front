/* eslint-disable no-restricted-syntax */
import spatialData from '@/data/navigation/spatial.generated.json';

import type { MapPoint } from './types';

export type VerificationStatus = 'VERIFIED' | 'ESTIMATED' | 'UNVERIFIED';
export type SpatialAreaType =
  | 'WALKABLE_AREA' | 'OPEN_AREA' | 'CORRIDOR' | 'WALL' | 'OBSTACLE'
  | 'FACILITY' | 'ENTRANCE' | 'INTERSECTION' | 'VERTICAL_CONNECTOR'
  | 'RESTRICTED_AREA' | 'UNKNOWN_AREA';

export interface SpatialArea {
  id: string;
  floor: string;
  type: SpatialAreaType;
  polygon: MapPoint[];
  verificationStatus: VerificationStatus;
  source: string;
}

export interface FloorSpatialData {
  floor: string;
  coordinateSystem: 'SVG_VIEWBOX';
  metersPerUnit: number;
  scaleVerificationStatus: VerificationStatus;
  viewBox: readonly [number, number, number, number];
  areas: SpatialArea[];
}

const floors = spatialData.floors as unknown as Record<string, FloorSpatialData>;
const blockingTypes = new Set<SpatialAreaType>([
  'WALL', 'OBSTACLE', 'FACILITY', 'VERTICAL_CONNECTOR', 'RESTRICTED_AREA', 'UNKNOWN_AREA',
]);
const EPSILON = 1e-7;

export function floorSpatialData(floor: string): FloorSpatialData | undefined {
  return floors[floor];
}

export function metersPerUnit(floor: string): number | null {
  return floors[floor]?.metersPerUnit ?? null;
}

export function polylineLength(points: readonly MapPoint[]): number {
  return points.slice(1).reduce((sum, point, index) =>
    sum + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0);
}

function cross(a: MapPoint, b: MapPoint, c: MapPoint): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(point: MapPoint, a: MapPoint, b: MapPoint): boolean {
  return Math.abs(cross(a, b, point)) <= EPSILON
    && point[0] >= Math.min(a[0], b[0]) - EPSILON
    && point[0] <= Math.max(a[0], b[0]) + EPSILON
    && point[1] >= Math.min(a[1], b[1]) - EPSILON
    && point[1] <= Math.max(a[1], b[1]) + EPSILON;
}

export function pointInPolygon(point: MapPoint, polygon: readonly MapPoint[]): boolean {
  let inside = false;
  for (let index = 0; index < polygon.length; index += 1) {
    const vertex = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    if (onSegment(point, vertex, next)) return true;
    if ((vertex[1] > point[1]) !== (next[1] > point[1])) {
      const x = vertex[0] + ((point[1] - vertex[1]) * (next[0] - vertex[0]))
        / (next[1] - vertex[1]);
      if (x > point[0]) inside = !inside;
    }
  }
  return inside;
}

function intersectionParameters(a: MapPoint, b: MapPoint, polygon: readonly MapPoint[]): number[] {
  const parameters = [0, 1];
  polygon.forEach((vertex, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const ex = next[0] - vertex[0];
    const ey = next[1] - vertex[1];
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) < EPSILON) return;
    const px = vertex[0] - a[0];
    const py = vertex[1] - a[1];
    const t = (px * ey - py * ex) / denominator;
    const u = (px * dy - py * dx) / denominator;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) parameters.push(t);
  });
  return parameters;
}

function distancePointToSegment(point: MapPoint, a: MapPoint, b: MapPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const ratio = denominator ? Math.max(0, Math.min(1,
    ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / denominator)) : 0;
  return Math.hypot(point[0] - a[0] - ratio * dx, point[1] - a[1] - ratio * dy);
}

function segmentDistance(a: MapPoint, b: MapPoint, c: MapPoint, d: MapPoint): number {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC * abD <= 0 && cdA * cdB <= 0) return 0;
  return Math.min(distancePointToSegment(a, c, d), distancePointToSegment(b, c, d),
    distancePointToSegment(c, a, b), distancePointToSegment(d, a, b));
}

export function segmentWalkability(
  floor: string,
  from: MapPoint,
  to: MapPoint,
  clearanceUnits = 0,
): 'PASS' | 'FAIL' | 'UNVERIFIED' {
  const data = floorSpatialData(floor);
  if (!data) return 'UNVERIFIED';
  const walkable = data.areas.filter((area) =>
    area.type === 'WALKABLE_AREA' || area.type === 'OPEN_AREA' || area.type === 'CORRIDOR');
  const blocked = data.areas.filter((area) => blockingTypes.has(area.type));
  const parameters = [...new Set([
    0, 1,
    ...data.areas.flatMap((area) => intersectionParameters(from, to, area.polygon)),
  ])].sort((a, b) => a - b);
  for (let index = 0; index < parameters.length - 1; index += 1) {
    const t = (parameters[index] + parameters[index + 1]) / 2;
    const point: MapPoint = [from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t];
    if (!walkable.some((area) => pointInPolygon(point, area.polygon))) return 'UNVERIFIED';
    if (blocked.some((area) => pointInPolygon(point, area.polygon))) return 'FAIL';
  }
  if (clearanceUnits > 0) {
    for (const area of [...blocked, ...walkable]) {
      for (let index = 0; index < area.polygon.length; index += 1) {
        const a = area.polygon[index];
        const b = area.polygon[(index + 1) % area.polygon.length];
        if (segmentDistance(from, to, a, b) < clearanceUnits) return 'FAIL';
      }
    }
  }
  return 'PASS';
}

export function polylineWalkability(
  floor: string, points: readonly MapPoint[], clearanceUnits = 0,
): 'PASS' | 'FAIL' | 'UNVERIFIED' {
  let result: 'PASS' | 'FAIL' | 'UNVERIFIED' = 'PASS';
  points.slice(1).forEach((point, index) => {
    const status = segmentWalkability(floor, points[index], point, clearanceUnits);
    if (status === 'FAIL') result = 'FAIL';
    else if (status === 'UNVERIFIED' && result === 'PASS') result = 'UNVERIFIED';
  });
  return result;
}
