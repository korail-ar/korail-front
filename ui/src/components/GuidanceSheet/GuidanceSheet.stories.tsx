import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Button from '@/components/Button/Button';

import GuidanceSheet, { GUIDANCE_SHEET_LINK_CLASS_NAMES } from './GuidanceSheet';

const meta = {
  title: 'Components/GuidanceSheet',
  component: GuidanceSheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex w-[375px] flex-col justify-end bg-map-ground pt-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuidanceSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** C안 스팟 확인 패널(303:5574): 손잡이 없음 */
export const SpotCheck: Story = {
  args: {
    eyebrow: '다음 확인 지점',
    title: '맞이방 통로 끝',
    description: '해당 지점에 도착한 뒤 눌러주세요.\n다음 구간이 화면 위쪽으로 정렬돼요.',
    primaryAction: <Button>다음 단계</Button>,
    secondaryAction: (
      <button type="button" className={GUIDANCE_SHEET_LINK_CLASS_NAMES}>
        시작 위치 다시 확인
      </button>
    ),
  },
};

/** B안 지도 따라가기 패널(295:3362): 손잡이 있음 */
export const FollowMap: Story = {
  args: {
    showHandle: true,
    eyebrow: '맞이방 QR → 매표소',
    title: '플라잉스콘을 지나 매표소로',
    description: '사진과 주변 간판을 비교하며 이동하세요.',
    primaryAction: <Button>도착했어요 · 안내 종료</Button>,
    secondaryAction: (
      <button type="button" className={GUIDANCE_SHEET_LINK_CLASS_NAMES}>
        전체 이동 순서 보기
      </button>
    ),
  },
};

/** 안내문만 있는 패널 */
export const WithNote: Story = {
  args: {
    showHandle: true,
    title: '이 간판을 찾아보세요',
    primaryAction: <Button>확인했어요 · 지도로 돌아가기</Button>,
    note: '사진과 다르면 가까운 QR에서 위치 다시 확인',
  },
};
