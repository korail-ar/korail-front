import { describe, expect, it } from 'vitest';
import generatedGraph from '@/data/navigation/graph.generated.json';

import { findNavigationRoute, graphSummary } from './navigation';
import { polylineWalkability } from './spatial';

describe('shared indoor navigation engine', () => {
  it('keeps both regression destinations reachable without a backtracking polyline', () => {
    ['3F:P26', '3F:P50'].forEach((destination) => {
      const route = findNavigationRoute('3F:C01', destination);
      expect(route?.validation.isValid).toBe(true);
      expect(route?.floorSegments).toHaveLength(1);
      expect(route?.metrics.distanceMeters).toBeLessThan(destination === '3F:P26' ? 65 : 120);
      expect(route?.metrics.turnCount).toBeLessThanOrEqual(2);
      expect(route?.metrics.instructionCount).toBeLessThanOrEqual(3);
      const segment = route?.floorSegments[0];
      if (!segment || segment.kind !== 'floor') throw new Error('missing floor route');
      expect(segment.points.some((point, index) => index > 1
        && point[0] === segment.points[index - 2][0]
        && point[1] === segment.points[index - 2][1])).toBe(false);
    });
  });

  it('keeps accessible travel on elevators and reports missing 2F connection', () => {
    const route = findNavigationRoute('3F:C01', '1F:1E05', { mode: 'ACCESSIBLE' });
    expect(route?.floorSegments.some((segment) => segment.kind === 'transfer'
      && segment.connectorType === 'elevator')).toBe(true);
    expect(route?.floorSegments.some((segment) => segment.kind === 'transfer'
      && segment.connectorType === 'stairs')).toBe(false);
    expect(findNavigationRoute('3F:C01', '2F:2A01', { mode: 'ACCESSIBLE' })).toBeNull();
  });

  it('supports same-origin and bidirectional inter-floor routes', () => {
    expect(findNavigationRoute('3F:C01', '3F:C01')?.metrics.distanceMeters).toBe(0);
    expect(findNavigationRoute('1F:1E05', '4F:4A15')).not.toBeNull();
    expect(findNavigationRoute('4F:4A15', '1F:1E05')).not.toBeNull();
    expect(graphSummary().nodes).toBe(153);
  });

  it('renders a valid same-floor route on each of the four floor plans', () => {
    (['1F', '2F', '3F', '4F'] as const).forEach((floor) => {
      const edge = generatedGraph.floors[floor].edges.find((item) => item.routingEnabled);
      if (!edge) throw new Error(`No enabled edge on ${floor}`);
      const route = findNavigationRoute(`${floor}:${edge.source}`, `${floor}:${edge.target}`);
      expect(route?.validation.isValid, floor).toBe(true);
      expect(route?.floorSegments).toHaveLength(1);
      const segment = route?.floorSegments[0];
      if (!segment || segment.kind !== 'floor') throw new Error(`Missing floor segment on ${floor}`);
      expect(polylineWalkability(floor, segment.points)).not.toBe('FAIL');
      expect(route?.instructions.flatMap((step, index) => step.geometry.slice(index === 0 ? 0 : 1)))
        .toEqual(segment.points);
    });
  });
});
