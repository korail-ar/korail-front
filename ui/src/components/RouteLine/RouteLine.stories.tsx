import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import RouteLine, { type RoutePoint } from './RouteLine';

// Figma RouteLine 미리보기와 같은 경로(180×64).
const SAMPLE_POINTS: readonly RoutePoint[] = [
  [10, 54],
  [10, 32],
  [170, 32],
  [170, 10],
];

const meta = {
  title: 'Map/RouteLine',
  component: RouteLine,
  args: { points: SAMPLE_POINTS },
  decorators: [
    (Story) => (
      <div className="inline-flex rounded-sm bg-map-ground p-5">
        <svg width="180" height="64" viewBox="0 0 180 64" overflow="visible" aria-hidden>
          <Story />
        </svg>
      </div>
    ),
  ],
} satisfies Meta<typeof RouteLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 층이 바뀌는 구간(점선). */
export const Transfer: Story = {
  args: { transfer: true },
};
