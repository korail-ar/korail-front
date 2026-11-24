import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import NumberBadge from './NumberBadge';

const meta = {
  title: 'Components/NumberBadge',
  component: NumberBadge,
  args: { kind: 'exit', number: 1 },
} satisfies Meta<typeof NumberBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Exit: Story = {};

export const Platform: Story = {
  args: { kind: 'platform' },
};

export const Car: Story = {
  args: { kind: 'car' },
};

export const All: Story = {
  render: () => (
    <div className="flex gap-6">
      <NumberBadge kind="exit" number={1} />
      <NumberBadge kind="platform" number={1} />
      <NumberBadge kind="car" number={1} />
    </div>
  ),
};
