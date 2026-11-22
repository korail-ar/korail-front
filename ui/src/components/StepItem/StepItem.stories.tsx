import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import StepItem from './StepItem';

const meta = {
  title: 'Components/StepItem',
  component: StepItem,
  args: { state: 'current', icon: 'turn-right', text: '출입구 1에서 앞으로 직진' },
  decorators: [
    (Story) => (
      <ol className="w-[300px]">
        <Story />
      </ol>
    ),
  ],
} satisfies Meta<typeof StepItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Current: Story = {
  args: { sub: '매장 B가 왼쪽에 보여요 · 약 30m' },
};

export const Done: Story = {
  args: { state: 'done' },
};

export const Next: Story = {
  args: { state: 'next', icon: 'pin' },
};

export const List: Story = {
  render: () => (
    <>
      <StepItem state="done" icon="arrow-up" text="출입구 1에서 앞으로 직진" />
      <StepItem
        state="current"
        icon="turn-right"
        text="대합실 앞에서 오른쪽으로"
        sub="매장 B가 왼쪽에 보여요 · 약 30m"
      />
      <StepItem state="next" icon="pin" text="매표·안내 창구 도착" />
    </>
  ),
};
