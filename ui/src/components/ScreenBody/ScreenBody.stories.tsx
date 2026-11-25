import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import AppBar from '@/components/AppBar/AppBar';

import ScreenBody from './ScreenBody';

const meta = {
  title: 'Components/ScreenBody',
  component: ScreenBody,
  parameters: { layout: 'fullscreen' },
  // 앱은 화면 높이에 고정되므로 낮은 화면(568px)에서 본문만 스크롤되는지 본다.
  // (데코레이터 JSX 바로 앞 괄호 안에 줄 주석을 두면 Storybook 색인기가 파일을 읽지 못한다.)
  decorators: [
    (Story) => (
      <div className="flex h-142 w-[375px] flex-col overflow-hidden bg-bg">
        <AppBar title="낮은 화면" backHref="/" />
        <Story />
      </div>
    ),
  ],
  args: {
    children: Array.from({ length: 12 }, (_, i) => (
      <p key={i} className="mt-4 rounded-md border border-line bg-surface p-4 text-body text-ink">
        {`본문 ${i + 1}`}
      </p>
    )),
  },
} satisfies Meta<typeof ScreenBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 지도 없는 화면: AppBar 아래 남은 높이를 채우고 안에서 스크롤 */
export const Fill: Story = {};
