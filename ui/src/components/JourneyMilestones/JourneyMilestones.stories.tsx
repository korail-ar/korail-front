import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import JourneyMilestones from './JourneyMilestones';

const MILESTONES = [
  { id: 'start', label: '맞이방 QR', role: '출발' },
  { id: 'via', label: '플라잉스콘', role: '경유' },
  { id: 'end', label: '매표소', role: '도착' },
];

const meta = {
  title: 'Map/JourneyMilestones',
  component: JourneyMilestones,
  decorators: [
    (Story) => (
      <div className="w-[335px] bg-bg p-4">
        <Story />
      </div>
    ),
  ],
  args: { milestones: MILESTONES, current: 0 },
} satisfies Meta<typeof JourneyMilestones>;

export default meta;
type Story = StoryObj<typeof meta>;

/** W06 경로 미리보기: 출발만 채움 */
export const Preview: Story = {};

/** W07·W08 안내 중: 경유 지점이 지금 */
export const AtWaypoint: Story = { args: { current: 1 } };

/** 경유를 지나 도착 지점 */
export const AtDestination: Story = { args: { current: 2 } };

/** 보이는 시설이 없을 때: 출발 · 도착 두 지점 */
export const TwoPoints: Story = {
  args: { milestones: [MILESTONES[0], MILESTONES[2]], current: 1 },
};

/** 긴 이름은 한 줄로 줄임 */
export const LongNames: Story = {
  args: {
    milestones: [
      MILESTONES[0],
      { id: 'via', label: '신청도할매김밥&부산오뎅', role: '경유' },
      { id: 'end', label: '승강장 연결통로 3 (5·6번 승강장)', role: '도착' },
    ],
    current: 1,
  },
};
