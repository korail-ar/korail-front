import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import IconButton from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { icon: 'chev-left', label: '뒤로', onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = {
  args: { className: 'bg-surface-sunken' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Close: Story = {
  args: { icon: 'close', label: '닫기' },
};
