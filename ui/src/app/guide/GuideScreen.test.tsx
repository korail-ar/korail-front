import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_START, findPlace } from '@/lib/station/data';
import { findRoute } from '@/lib/station/route';
import useJourney, { type Journey } from '@/lib/station/useJourney';

import GuideScreen from './GuideScreen';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/station/useJourney', () => ({ default: vi.fn() }));
vi.mock('@/components/StepNavigationMap/StepNavigationMap', () => ({
  default: ({ segment }: { segment: { id: string } }) => <div data-testid="step-map">{segment.id}</div>,
}));

describe('manual guide controls', () => {
  beforeEach(() => {
    push.mockReset();
    const destination = findPlace(18)!;
    const route = findRoute(DEFAULT_START.nodeId, destination.routeNodeId!)!;
    vi.mocked(useJourney).mockReturnValue({
      status: 'ok', route, destination, destinationLabel: destination.name,
      start: DEFAULT_START, params: new URLSearchParams('to=18&platform=10'),
      stepIndex: 0, href: (path: string) => path,
    } as unknown as Journey);
  });

  it('shows one segment until a button click, supports back, and confirms the last step', async () => {
    const user = userEvent.setup();
    render(<GuideScreen />);
    const first = screen.getByTestId('step-map').textContent;
    expect(screen.getByRole('button', { name: '이전 지점으로' })).toBeDisabled();
    expect(screen.getByTestId('step-map').textContent).toBe(first);

    await user.click(screen.getByRole('button', { name: '다음 단계' }));
    expect(screen.getByTestId('step-map').textContent).not.toBe(first);
    await user.click(screen.getByRole('button', { name: '이전 지점으로' }));
    expect(screen.getByTestId('step-map').textContent).toBe(first);

    while (screen.queryByRole('button', { name: '다음 단계' })) {
      // eslint-disable-next-line no-await-in-loop -- Each click must finish before the next button state is read.
      await user.click(screen.getByRole('button', { name: '다음 단계' }));
    }
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '도착 확인' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/arrive'));
  });
});
