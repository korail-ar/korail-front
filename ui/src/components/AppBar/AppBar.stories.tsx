import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import AppBar from './AppBar';

const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  decorators: [
    (Story) => (
      <div className="w-[375px] bg-bg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 홈: 뒤로 버튼 없음 */
export const Home: Story = { args: { title: '대전역 길안내' } };

export const WithBack: Story = { args: { title: '경로 확인', backHref: '/search' } };

export const LongTitle: Story = {
  args: { title: '승강장 승강기 (11–12번 홈)으로 가는 중입니다', backHref: '/route' },
};
