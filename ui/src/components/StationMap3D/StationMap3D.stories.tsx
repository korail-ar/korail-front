import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Button from '@/components/Button/Button';
import { DEFAULT_START, findNode } from '@/lib/station/data';
import type { MapPoint } from '@/lib/station/types';

import StationMap3D from './StationMap3D';

const startNode = findNode(DEFAULT_START.nodeId)!;

const meta = {
  title: 'Map/StationMap3D',
  component: StationMap3D,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="w-[375px]">
        <Story />
      </div>
    ),
  ],
  args: {
    className: 'h-102',
    start: { point: [startNode.x, startNode.y] as MapPoint, label: 'QR 출발점' },
  },
} satisfies Meta<typeof StationMap3D>;

export default meta;
type Story = StoryObj<typeof meta>;

/** W01 홈: 끌어서 돌려 보고 층을 눌러 고른다 */
export const Default: Story = {};

/** 왼쪽 아래에 2D 보기 버튼을 둔 홈 화면 배치 */
export const WithViewToggle: Story = {
  args: {
    toolbarStart: (
      <Button variant="secondary" className="w-23 px-0">
        2D 보기
      </Button>
    ),
  },
};
