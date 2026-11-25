import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import RouteEndpoint from './RouteEndpoint';

const meta = {
  title: 'Map/RouteEndpoint',
  component: RouteEndpoint,
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-ground p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteEndpoint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 출발(QR 안내 시작 위치) · 노랑 */
export const Start: Story = { args: { type: 'start' } };

/** 도착 · 파랑 */
export const End: Story = { args: { type: 'end' } };
