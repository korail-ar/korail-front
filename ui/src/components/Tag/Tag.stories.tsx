import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Tag from './Tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  args: { label: '3층' },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = {
  args: { variant: 'info' },
};

export const Start: Story = {
  args: { variant: 'start' },
};

export const Warn: Story = {
  args: { variant: 'warn', label: '정보 확인 필요' },
};

export const All: Story = {
  render: () => (
    <div className="flex gap-6">
      <Tag label="3층" />
      <Tag label="3층" variant="info" />
      <Tag label="3층" variant="start" />
      <Tag label="3층" variant="warn" />
    </div>
  ),
};
