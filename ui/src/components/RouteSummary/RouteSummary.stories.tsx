import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import RouteSummary from './RouteSummary';

const meta = {
  title: 'Components/RouteSummary',
  component: RouteSummary,
  args: {
    from: '출입구 1 안쪽',
    to: '매표·안내 창구',
    time: '약 2분',
    distance: '약 120m · 같은 층',
    stepCount: 3,
    floor: '3층',
    onAction: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OtherFloor: Story = {
  args: {
    to: '타는 곳 5번',
    time: '약 6분',
    distance: '약 340m · 2층으로 이동',
    stepCount: 6,
    floor: '2층',
  },
};
