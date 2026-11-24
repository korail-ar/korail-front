import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import FloorControl from './FloorControl';
import RecenterControl from './RecenterControl';
import ZoomControl from './ZoomControl';

const FLOORS = ['4F', '3F', '2F', '1F'] as const;

const meta = {
  title: 'Map/MapControls',
  component: ZoomControl,
  args: { onZoomIn: fn(), onZoomOut: fn() },
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-ground p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ZoomControl>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 확대·축소. 버튼 하나 48×48px. */
export const Zoom: Story = {};

export const ZoomAtLimit: Story = {
  args: { canZoomIn: false },
};

/** 지도를 안내 시작 위치가 보이는 처음 상태로 되돌린다("내 위치로 이동" 아님). */
export const Recenter: Story = {
  render: () => <RecenterControl onRecenter={fn()} />,
};

function FloorControlDemo() {
  const [floor, setFloor] = useState<string>('3F');
  return <FloorControl floors={FLOORS} value={floor} onChange={setFloor} />;
}

/** 층 선택. 안내 범위가 여러 층일 때만 표시. 층 이름은 예시(미정). */
export const Floors: Story = {
  render: () => <FloorControlDemo />,
};

export const All: Story = {
  render: (args) => (
    <div className="flex items-start gap-10">
      <ZoomControl {...args} />
      <RecenterControl onRecenter={fn()} />
      <FloorControlDemo />
    </div>
  ),
};
