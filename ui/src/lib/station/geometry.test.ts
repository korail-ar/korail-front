import { describe, expect, it } from 'vitest';

import { countMeaningfulTurns, optimizeFloorGeometry } from './geometry';

describe('safe path geometry', () => {
  it('shortens a visible corridor while keeping its endpoints', () => {
    const route = optimizeFloorGeometry('3F', [[855, 1145], [755, 1145], [610, 1145]]);
    expect(route.status).toBe('PASS');
    expect(route.points).toEqual([[855, 1145], [610, 1145]]);
  });

  it('does not pull a line through a shop', () => {
    const route = optimizeFloorGeometry('3F', [
      [855, 995], [855, 1145], [610, 1145],
    ]);
    expect(route.points).toContainEqual([855, 1145]);
    expect(countMeaningfulTurns(route.points)).toBe(1);
  });

  it('preserves an unverified outside-floor route without claiming it is clear', () => {
    const points: [number, number][] = [[100, 100], [105, 105], [110, 110]];
    const route = optimizeFloorGeometry('3F', points);
    expect(route.status).toBe('UNVERIFIED');
    expect(route.points).toEqual(points);
  });
});
