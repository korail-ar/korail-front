import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Button from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: '길찾기',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LongText: Story = {
  args: { children: '대전역 3번 출구 엘리베이터까지 안내 시작' },
};
