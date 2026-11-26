import { describe, expect, it } from 'vitest';

import { pointInPolygon, polylineLength, segmentWalkability } from './spatial';

describe('spatial floor plan', () => {
  it('checks polygon boundaries and diagonal distance', () => {
    const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(pointInPolygon([0, 5], square)).toBe(true);
    expect(pointInPolygon([5, 5], square)).toBe(true);
    expect(pointInPolygon([11, 5], square)).toBe(false);
    expect(polylineLength([[0, 0], [3, 4]])).toBe(5);
  });

  it('allows the MaruNova corridor but rejects a shop crossing', () => {
    expect(segmentWalkability('3F', [855, 1145], [610, 1145], 3)).toBe('PASS');
    expect(segmentWalkability('3F', [855, 1100], [610, 1100])).toBe('FAIL');
  });

  it('does not certify space outside the floor outline', () => {
    expect(segmentWalkability('3F', [100, 100], [110, 110])).toBe('UNVERIFIED');
  });
});
