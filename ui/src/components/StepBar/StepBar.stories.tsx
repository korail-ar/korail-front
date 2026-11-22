import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import StepBar from './StepBar';

const meta = {
  title: 'Components/StepBar',
  component: StepBar,
  args: {
    icon: 'turn-right',
    text: '대합실 앞에서 오른쪽으로',
    sub: '매장 B가 왼쪽에 보여요 · 약 30m',
  },
  decorators: [
    (Story) => (
      <div className="w-80 bg-map-ground p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSub: Story = {
  args: { icon: 'arrow-up', text: '앞으로 직진', sub: undefined },
};
