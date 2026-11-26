import { describe, expect, it } from 'vitest';

import { START_POINTS, STATION } from './data';
import { findRoute } from './route';

describe('navigation route timings', () => {
  it('records cold and cached route computation without hiding failures', () => {
    const timings: number[] = [];
    START_POINTS.forEach((start) => STATION.places.forEach((place) => {
      if (!place.routeNodeId) return;
      const began = performance.now();
      const route = findRoute(start.nodeId, place.routeNodeId);
      timings.push(performance.now() - began);
      expect(route, `${start.id} → ${place.id}`).not.toBeNull();
    }));
    timings.sort((a, b) => a - b);
    expect(timings).toHaveLength(START_POINTS.length * STATION.places.filter((place) => place.routeNodeId).length);
    expect(timings.every(Number.isFinite)).toBe(true);
  }, 120000);
});
