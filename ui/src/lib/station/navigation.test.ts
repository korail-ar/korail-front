import { describe, expect, it } from 'vitest';

import { DEFAULT_START, START_POINTS, STATION, findPlace } from './data';
import { generateNavigationSegments, segmentsForRoute, type NavigationNode } from './navigation';
import { navigationReducer } from './navigationState';
import { navigationViewport } from './navigationViewport';
import { findRoute } from './route';

const nodes = (points: readonly (readonly [number, number])[]): NavigationNode[] => points.map((point, index) => ({
  id: String(index), floor: '3F', point,
}));
const edges = (path: readonly NavigationNode[]) => path.slice(1).map((node, index) => ({
  source: path[index].id, target: node.id,
}));
const make = (points: readonly (readonly [number, number])[]) => {
  const path = nodes(points);
  return generateNavigationSegments(path, edges(path));
};

describe('navigation segments', () => {
  it('merges straight and slightly drifting edges without dropping nodes', () => {
    const segments = make([[0, 0], [10, 1], [20, 1], [30, 2]]);
    expect(segments).toHaveLength(1);
    expect(segments[0].nodeIds).toEqual(['0', '1', '2', '3']);
  });

  it('splits right and left turns in downward SVG coordinates', () => {
    const segments = make([[0, 0], [10, 0], [10, 10], [20, 10]]);
    expect(segments.map((item) => item.instructionType)).toEqual(['STRAIGHT', 'TURN_RIGHT', 'TURN_LEFT']);
    expect(segments.flatMap((item, index) => index ? item.nodeIds.slice(1) : item.nodeIds))
      .toEqual(['0', '1', '2', '3']);
  });

  it('splits cumulative small changes at the 30 degree threshold', () => {
    const segments = make([[0, 0], [10, 0], [20, 2], [29, 6], [36, 13]]);
    expect(segments.length).toBeGreaterThan(1);
  });

  it('keeps duplicate coordinates and isolates a floor transfer', () => {
    const path = nodes([[0, 0], [0, 0], [10, 0], [10, 0], [10, 10]]);
    path[3].floor = '2F';
    path[4].floor = '2F';
    const links = edges(path);
    const segments = generateNavigationSegments(path, links.map((edge, index) => index === 2
      ? { ...edge, transfer: 'ELEVATOR' as const } : edge));
    expect(segments.some((item) => item.instructionType === 'ELEVATOR' && item.targetFloor === '2F')).toBe(true);
    expect(segments.flatMap((item, index) => index ? item.nodeIds.slice(1) : item.nodeIds))
      .toEqual(path.map((node) => node.id));
  });

  it('converts the actual concourse to platform 10 path', () => {
    const destination = findPlace(18);
    const route = findRoute(DEFAULT_START.nodeId, destination?.routeNodeId ?? '');
    expect(route).not.toBeNull();
    const segments = segmentsForRoute(route!, destination?.name);
    expect(segments.length).toBeGreaterThan(0);
    const expanded = segments.flatMap((item, index) => index ? item.nodeIds.slice(1) : item.nodeIds);
    expect(expanded.filter((id) => route!.nodeIds.includes(id))).toEqual(route!.nodeIds);
    expect(segments[0].instructionType).toBe('STRAIGHT');
  });

  it('uses the same segmentation for ticketing and every routable destination', () => {
    START_POINTS.forEach((start) => {
      STATION.places.filter((place) => place.routeNodeId).forEach((place) => {
        const path = findRoute(start.nodeId, place.routeNodeId!);
        expect(path).not.toBeNull();
        const segments = segmentsForRoute(path!, place.name);
        if (path!.nodeIds.length === 1) {
          expect(segments).toHaveLength(1);
          expect(segments[0].nodeIds).toEqual(path!.nodeIds);
          return;
        }
        const visited = segments.flatMap((item, index) => index ? item.nodeIds.slice(1) : item.nodeIds);
        expect(visited.filter((id) => path!.nodeIds.includes(id))).toEqual(path!.nodeIds);
        expect(segments.every((item, index) => index === 0
          || item.startNodeId === segments[index - 1].endNodeId)).toBe(true);
      });
    });
  });
});

describe('manual step state and camera', () => {
  const segments = make([[0, 0], [10, 0], [10, 10]]);
  it('advances only on click events, goes back, and confirms arrival at the end', () => {
    const initial = { status: 'PREVIEW' as const, segments, currentSegmentIndex: 0 };
    const started = navigationReducer(initial, { type: 'START_NAVIGATION' });
    expect(started.currentSegmentIndex).toBe(0);
    const next = navigationReducer(started, { type: 'NEXT_STEP' });
    expect(next.currentSegmentIndex).toBe(1);
    expect(navigationReducer(next, { type: 'PREVIOUS_STEP' }).currentSegmentIndex).toBe(0);
    expect(navigationReducer(next, { type: 'CONFIRM_ARRIVAL' }).status).toBe('ARRIVED');
    expect(navigationReducer(next, { type: 'RESET_NAVIGATION' }).status).toBe('PREVIEW');
  });

  it('points the current movement up and keeps its points in view', () => {
    const camera = navigationViewport(segments[0], 400, 600);
    const start = camera.project(segments[0].geometry[0]);
    const end = camera.project(segments[0].geometry.at(-1)!);
    expect(start.x).toBeCloseTo(200);
    expect(start.y).toBeGreaterThan(300);
    expect(end.y).toBeLessThan(start.y);
    expect(end.x).toBeCloseTo(start.x);
  });
});
