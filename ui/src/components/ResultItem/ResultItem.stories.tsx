import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import ResultItem from './ResultItem';

const meta = {
  title: 'Components/ResultItem',
  component: ResultItem,
  args: { icon: 'toilet', name: '화장실 (동쪽)', meta: '3층 · 매장 A 옆', onClick: fn() },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongText: Story = {
  args: {
    name: '대전역 서광장 방면 무인 물품보관함 (대형)',
    meta: '1층 · 서광장 출입구 2 옆 · 엘리베이터에서 약 40m',
  },
};

export const List: Story = {
  render: (args) => (
    <ul>
      <li>
        <ResultItem {...args} />
      </li>
      <li>
        <ResultItem {...args} icon="locker" name="물품보관함" meta="3층 · 화장실(동쪽) 옆" />
      </li>
      <li>
        <ResultItem {...args} icon="ticket" name="매표·안내 창구" meta="3층 · 대합실" />
      </li>
    </ul>
  ),
};
