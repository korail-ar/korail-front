import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapBadge from '@/components/MapBadge/MapBadge';

import CheckpointMarker from './CheckpointMarker';

const meta = {
  title: 'Map/CheckpointMarker',
  component: CheckpointMarker,
  decorators: [
    (Story) => (
      <div className="inline-flex flex-col items-center gap-3 bg-map-zone p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CheckpointMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** C안: 지도가 진행 방향을 위로 돌리므로 화살표는 위 */
export const Default: Story = {};

/** 지도를 돌리지 않을 때는 다음 구간 방향으로 화살표를 돌린다 */
export const TurnRight: Story = { args: { direction: 90 } };

/** 확인 지점 이름표와 함께(303:5564) */
export const WithLabel: Story = {
  render: (args) => (
    <>
      <CheckpointMarker {...args} />
      <MapBadge label="QR로 확인한 출발점" tone="muted" />
    </>
  ),
};
