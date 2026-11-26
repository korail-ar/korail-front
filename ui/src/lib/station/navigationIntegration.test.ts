import { describe, expect, it } from 'vitest';

import { START_POINTS, STATION } from './data';
import { findNavigationRoute } from './navigation';
import { findRoute } from './route';
import { polylineWalkability } from './spatial';
import { buildSteps } from './steps';

describe('navigation preview and instruction integration', () => {
  it('uses one final geometry for every QR start and 3F facility', () => {
    START_POINTS.forEach((start) => STATION.places.forEach((place) => {
      if (!place.routeNodeId) return;
      const route = findRoute(start.nodeId, place.routeNodeId);
      expect(route, `${start.id} → ${place.id}`).not.toBeNull();
      const navigation = route!.navigation!;
      expect(navigation.validation.isValid).toBe(true);
      expect(polylineWalkability('3F', route!.points)).not.toBe('FAIL');
      const walking = navigation.instructions.filter((step) => step.geometry.length > 1);
      const joined = walking.flatMap((step, index) => step.geometry.slice(index === 0 ? 0 : 1));
      if (route!.meters > 0) expect(joined).toEqual(route!.points);
      expect(buildSteps(route!, { startName: start.name, destination: place }).length)
        .toBe(navigation.metrics.instructionCount);
      const shortest = findNavigationRoute(`3F:${start.nodeId}`, `3F:${place.routeNodeId}`,
        { strategy: 'SHORTEST' })!;
      expect(route!.meters).toBeLessThanOrEqual(shortest.metrics.distanceMeters * 1.1 + 0.01);
    }));
  }, 120000);

  it('preserves directed and accessible vertical connections', () => {
    const examples = [
      ['1F:1E05', '4F:4A15'], ['4F:4A15', '1F:1E05'],
      ['3F:C01', '1F:1E05'],
    ];
    examples.forEach(([from, to]) => {
      const route = findNavigationRoute(from, to, { mode: 'ACCESSIBLE' });
      expect(route?.validation.isValid).toBe(true);
      expect(route?.floorSegments.some((segment) => segment.kind === 'transfer')).toBe(true);
      expect(route?.floorSegments.filter((segment) => segment.kind === 'transfer')
        .every((segment) => segment.connectorType === 'elevator')).toBe(true);
    });
    expect(findNavigationRoute('3F:C01', '2F:2A01', { mode: 'ACCESSIBLE' })).toBeNull();
  });
});
