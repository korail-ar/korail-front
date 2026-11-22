import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Button from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: '여기로 안내',
    icon: 'pin',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Text: Story = {
  args: { variant: 'text', icon: 'refresh' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const FullWidth: Story = {
  args: { fullWidth: true, icon: undefined, children: '안내 시작' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/** Figma Button(82:150)의 Type × State. Pressed는 누르는 동안(:active) 보인다. */
export const Matrix: Story = {
  render: (args) => (
    <div className="grid grid-cols-[repeat(3,max-content)] gap-5">
      <Button {...args} />
      <Button {...args} className="bg-brand-press" />
      <Button {...args} disabled />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="secondary" className="bg-brand-tint" />
      <Button {...args} variant="secondary" disabled />
      <Button {...args} variant="text" icon="refresh" />
      <Button {...args} variant="text" icon="refresh" className="bg-brand-tint" />
      <Button {...args} variant="text" icon="refresh" disabled />
    </div>
  ),
};
