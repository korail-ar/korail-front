import { describe, expect, it } from 'vitest';

import { allFacilities, findFacility, routeToFacility } from './facilities';

describe('facility access', () => {
  it('keeps display coordinates separate from the route endpoint', () => {
    const facility = findFacility(26)!;
    expect(facility.displayPosition).toEqual([603.5, 1117.2]);
    expect(facility.entrances[0].connectedNodeId).toBe('P26');
    expect(facility.entrances[0].position).toBeNull();
    const route = routeToFacility('3F:C01', 26)!;
    expect(route.validation.warnings).toContainEqual(
      expect.stringContaining('실제 출입구 위치 미확인'));
    expect(route.floorSegments[0].kind).toBe('floor');
  });

  it('does not certify an accessible entrance without evidence', () => {
    expect(routeToFacility('3F:C01', 26, { mode: 'ACCESSIBLE' })).toBeNull();
    expect(allFacilities()).toHaveLength(59);
  });
});
