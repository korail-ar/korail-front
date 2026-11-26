import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NavigationSegment } from '@/lib/station/navigation';

import StepNavigationMap from './StepNavigationMap';

const originalFetch = globalThis.fetch;
const originalResizeObserver = globalThis.ResizeObserver;

function segment(floor: string): NavigationSegment {
  return {
    id: `${floor}-test`, index: 0, floor, targetFloor: floor,
    startNodeId: 'A', endNodeId: 'B', nodeIds: ['A', 'B'],
    geometry: [[100, 100], [200, 100]], heading: 0, turnAngle: 0,
    instructionType: 'STRAIGHT', instruction: '통로를 따라 이동하세요.',
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('step map', () => {
  it('uses the same matrix for map and route, counter-rotates labels, and changes floor plans', async () => {
    class FakeResizeObserver implements ResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe = () => this.callback(
        [{ contentRect: { width: 400, height: 600 } } as ResizeObserverEntry], this,
      );

      disconnect = vi.fn();

      unobserve = vi.fn();
    }
    globalThis.ResizeObserver = FakeResizeObserver;
    const fetcher = vi.fn().mockResolvedValue({
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><text x="100" y="100">Facility</text></svg>',
    });
    globalThis.fetch = fetcher;
    const { container, rerender } = render(
      <StepNavigationMap segment={segment('3F')} previous={[]} endLabel="도착점" />,
    );
    await waitFor(() => expect(container.querySelector('.upright-label')).not.toBeNull());
    const group = container.querySelector('svg > g') as SVGGElement;
    expect(group.style.transform).toContain('matrix(');
    expect(group.style.getPropertyValue('--label-counter-rotation')).toBe('90deg');
    expect(group.querySelector('polyline')).not.toBeNull();
    expect(fetcher).toHaveBeenCalledWith('/maps/web-3F-map.svg');

    rerender(<StepNavigationMap segment={segment('2F')} previous={[]} endLabel="도착점" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/maps/web-2F-map.svg'));
  });
});
