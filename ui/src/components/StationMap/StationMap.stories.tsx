import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DEFAULT_START, findNode, findPlace } from '@/lib/station/data';
import { findRoute } from '@/lib/station/route';
import type { MapPoint } from '@/lib/station/types';

import StationMap from './StationMap';

const startNode = findNode(DEFAULT_START.nodeId)!;
const start = { point: [startNode.x, startNode.y] as MapPoint, label: DEFAULT_START.name };
const ticketOffice = findPlace(32)!;
const route = findRoute(DEFAULT_START.nodeId, ticketOffice.routeNodeId!)!;
const end = route.points[route.points.length - 1];

const meta = {
  title: 'Map/StationMap',
  component: StationMap,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="w-[375px]">
        <Story />
      </div>
    ),
  ],
  args: { className: 'h-70', caption: '3층 · 경로는 현장 확인 전 추정이에요' },
} satisfies Meta<typeof StationMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** W01 홈: 시작 위치만 */
export const StartOnly: Story = {
  args: {
    className: 'h-100',
    start,
    showFloorControl: false,
    showZoomControl: false,
    recenterPlacement: 'bottom-right',
  },
};

/** W06 경로 미리보기 */
export const Route: Story = {
  args: {
    route: route.points,
    start,
    destination: { point: end, label: ticketOffice.name },
  },
};

/** W09 층 이동: 경로 끝 층 이동 지점(민트 이름표) */
export const FloorChange: Story = {
  args: {
    route: route.points,
    start,
    floorPoint: { point: end, label: '승강장 연결통로 3 (5·6번 승강장)' },
  },
};
