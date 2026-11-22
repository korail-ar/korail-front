import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import StateMessage from './StateMessage';

const meta = {
  title: 'Components/StateMessage',
  component: StateMessage,
  args: { type: 'loading' },
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StateMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 아이콘은 회전 표시(동작 줄이기 설정이면 멈춤). */
export const Loading: Story = {};

export const Empty: Story = {
  args: { type: 'empty' },
};

export const NeedsCheck: Story = {
  args: { type: 'needs-check' },
};

export const NoRoute: Story = {
  args: { type: 'no-route', action: { label: '목적지 변경', onClick: fn() } },
};

/** 빨강은 오류에만. */
export const Error: Story = {
  args: { type: 'error', action: { label: '다시 시도', onClick: fn() } },
};
