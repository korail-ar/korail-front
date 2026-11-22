import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapMarker from './MapMarker';

const meta = {
  title: 'Map/MapMarker',
  component: MapMarker,
  args: { type: 'destination', icon: 'ticket' },
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-ground p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapMarker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 핀 끝이 실제 위치. */
export const Destination: Story = {};

/** QR 안내 시작 위치. 멈춰 있는 표시(움직임·방향 화살표 없음). */
export const Start: Story = {
  args: { type: 'start' },
};

/** 층간 이동(계단·엘리베이터). */
export const Floor: Story = {
  args: { type: 'floor', icon: 'stairs' },
};

export const Step: Story = {
  args: { type: 'step', step: 1 },
};

export const FacilitySelected: Story = {
  args: { type: 'facility-selected', icon: 'locker' },
};

export const Facility: Story = {
  args: { type: 'facility', icon: 'locker' },
};

/** 경로가 켜졌을 때 나머지 시설. */
export const FacilityDim: Story = {
  args: { type: 'facility-dim' },
};

/** 우선순위 순서: 목적지 → 안내 시작 위치 → 층간 이동 → 단계 지점 → 선택된 시설 → 시설 → 흐린 시설 */
export const All: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <MapMarker type="destination" icon="ticket" />
      <MapMarker type="start" />
      <MapMarker type="floor" icon="stairs" />
      <MapMarker type="step" step={1} />
      <MapMarker type="facility-selected" icon="locker" />
      <MapMarker type="facility" icon="locker" />
      <MapMarker type="facility-dim" />
    </div>
  ),
};
