import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import StepBar from './StepBar';

const meta = {
  title: 'Components/StepBar',
  component: StepBar,
  args: {
    icon: 'turn-right',
    text: '대합실 앞에서 오른쪽으로',
    sub: '매장 B가 왼쪽에 보여요 · 약 30m',
  },
  decorators: [
    (Story) => (
      <div className="w-80 bg-map-ground p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSub: Story = {
  args: { icon: 'arrow-up', text: '앞으로 직진', sub: undefined },
};

/** 경로 안내 B안 "이번에 할 행동"(Figma 295:3341): 지도 위에 띄우는 브랜드 파랑 카드 */
export const Floating: Story = {
  args: {
    variant: 'floating',
    icon: 'arrow-up',
    text: '플라잉스콘 방향으로 직진',
    sub: '매장을 오른쪽에 두고 이동하세요',
  },
};

/** 경로 안내 C안 "구간 안내"(Figma 303:5571): 아이콘 없이 문장만 */
export const FloatingWithoutIcon: Story = {
  args: {
    variant: 'floating',
    icon: undefined,
    text: '통로 끝까지 곧장 이동하세요',
    sub: '안내된 통로 끝을 확인하면 다음 단계',
  },
};
