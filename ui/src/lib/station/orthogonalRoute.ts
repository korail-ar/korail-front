import plan from '@/data/station/3f-walkable-plan.generated.json';

import type { MapPoint, Route } from './types';

export interface WalkablePlan {
  polygon: readonly (readonly number[])[];
  rooms: readonly (readonly number[])[];
}

export interface RouteGeometryEdge {
  source: string;
  target: string;
  points: MapPoint[];
  status: 'original_axis' | 'plan_checked_orthogonal' | 'needs_data_review';
}

export interface OrthogonalRoute {
  nodeIds: string[];
  points: MapPoint[];
  edges: RouteGeometryEdge[];
  reviewEdgeIds: string[];
}

const SAMPLE_STEP = 2;
const CORNER_DEVIATION_LIMIT = 24;
const EPSILON = 0.01;

function insidePolygon([x, y]: MapPoint, polygon: WalkablePlan['polygon']): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function isWalkablePoint(point: MapPoint, mask: WalkablePlan): boolean {
  if (!insidePolygon(point, mask.polygon)) return false;
  return !mask.rooms.some(([x, y, width, height]) => point[0] >= x && point[0] <= x + width
    && point[1] >= y && point[1] <= y + height);
}

export function isWalkableLine(from: MapPoint, to: MapPoint, mask: WalkablePlan): boolean {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const samples = Math.max(1, Math.ceil(length / SAMPLE_STEP));
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    if (!isWalkablePoint([from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t], mask)) return false;
  }
  return true;
}

function cornerDeviation(from: MapPoint, to: MapPoint, corner: MapPoint): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return Math.abs(dx * (from[1] - corner[1]) - dy * (from[0] - corner[0]))
    / Math.max(Math.hypot(dx, dy), EPSILON);
}

/** Conservative geometry overlay. Never changes Dijkstra node order or edge connectivity. */
export function buildOrthogonalRoute(route: Route, mask: WalkablePlan = plan): OrthogonalRoute {
  const edges: RouteGeometryEdge[] = [];
  const points: MapPoint[] = route.points.length ? [route.points[0]] : [];
  for (let i = 0; i < route.points.length - 1; i += 1) {
    const from = route.points[i];
    const to = route.points[i + 1];
    const dx = Math.abs(to[0] - from[0]);
    const dy = Math.abs(to[1] - from[1]);
    let geometry: MapPoint[] = [from, to];
    let status: RouteGeometryEdge['status'] = dx < EPSILON || dy < EPSILON
      ? 'original_axis' : 'needs_data_review';
    if (status === 'needs_data_review') {
      const candidates: MapPoint[] = [[to[0], from[1]], [from[0], to[1]]];
      const safe = candidates.filter((corner) => cornerDeviation(from, to, corner) <= CORNER_DEVIATION_LIMIT
        && isWalkableLine(from, corner, mask) && isWalkableLine(corner, to, mask));
      if (safe.length) {
        const [corner] = safe.sort((a, b) => cornerDeviation(from, to, a) - cornerDeviation(from, to, b));
        geometry = [from, corner, to];
        status = 'plan_checked_orthogonal';
      }
    }
    edges.push({ source: route.nodeIds[i], target: route.nodeIds[i + 1], points: geometry, status });
    points.push(...geometry.slice(1));
  }
  return {
    nodeIds: [...route.nodeIds], points, edges,
    reviewEdgeIds: edges.filter((edge) => edge.status === 'needs_data_review')
      .map((edge) => `${edge.source}-${edge.target}`),
  };
}
