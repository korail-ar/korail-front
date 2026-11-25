import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapBadge from './MapBadge';

const meta = {
  title: 'Map/MapBadge',
  component: MapBadge,
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-zone p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 층 표시(295:2923) */
export const Floor: Story = { args: { label: '3F · 맞이방' } };

/** 확인 지점 이름(303:5564) */
export const Checkpoint: Story = { args: { label: '확인한 스팟 · 플라잉스콘', tone: 'muted' } };
