import { describe, expect, it } from 'vitest';

import plan from '@/data/station/3f-walkable-plan.generated.json';

import { DEFAULT_START, findPlace } from './data';
import { buildOrthogonalRoute, isWalkableLine, type WalkablePlan } from './orthogonalRoute';
import { findRoute } from './route';
import type { Route } from './types';

const open: WalkablePlan = {
  polygon: [[-100, -100], [100, -100], [100, 100], [-100, 100]],
  rooms: [],
};
const route = (points: Route['points']): Route => ({
  nodeIds: points.map((_, index) => String(index)), points: [...points], meters: 0, minutes: 1,
});

describe('plan checked orthogonal geometry', () => {
  it('creates a right angle only when both parts are walkable', () => {
    const result = buildOrthogonalRoute(route([[0, 0], [20, 10]]), open);
    expect(result.edges[0].status).toBe('plan_checked_orthogonal');
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toEqual([0, 0]);
    expect(result.points.at(-1)).toEqual([20, 10]);
    expect(result.nodeIds).toEqual(['0', '1']);
  });

  it('keeps the original diagonal when both corners cross a room', () => {
    const blocked: WalkablePlan = { ...open, rooms: [[8, -1, 4, 3], [-1, 4, 3, 4]] };
    const result = buildOrthogonalRoute(route([[0, 0], [20, 10]]), blocked);
    expect(result.edges[0].status).toBe('needs_data_review');
    expect(result.points).toEqual([[0, 0], [20, 10]]);
  });

  it('does not turn a long diagonal into an unverified detour', () => {
    const result = buildOrthogonalRoute(route([[0, 0], [90, 90]]), open);
    expect(result.edges[0].status).toBe('needs_data_review');
  });

  it('checks every converted segment of the actual platform 10 path against the plan mask', () => {
    const destination = findPlace(18)!;
    const path = findRoute(DEFAULT_START.nodeId, destination.routeNodeId!)!;
    const result = buildOrthogonalRoute(path);
    expect(result.nodeIds).toEqual(path.nodeIds);
    result.edges.filter((edge) => edge.status === 'plan_checked_orthogonal')
      .forEach((edge) => {
        expect(isWalkableLine(edge.points[0], edge.points[1], plan)).toBe(true);
        expect(isWalkableLine(edge.points[1], edge.points[2], plan)).toBe(true);
      });
  });
  it('inspects the existing ticket office route', () => {
    const destination = findPlace(22)!;
    const path = findRoute(DEFAULT_START.nodeId, destination.routeNodeId!)!;
    const result = buildOrthogonalRoute(path);
    expect(result.nodeIds).toEqual(path.nodeIds);
  });
});
