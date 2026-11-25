import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import LandmarkRow from './LandmarkRow';

const meta = {
  title: 'Components/LandmarkRow',
  component: LandmarkRow,
  decorators: [
    (Story) => (
      <ol className="w-[335px] bg-surface p-4">
        <Story />
      </ol>
    ),
  ],
  args: { number: 2, title: '플라잉스콘 통과', description: '매장을 오른쪽에 두고 이동' },
} satisfies Meta<typeof LandmarkRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = { args: { description: undefined } };

export const LongTitle: Story = {
  args: {
    number: 3,
    title: '승강장 연결통로 3 (5·6번 승강장) 표지판 확인',
    description: '계단·에스컬레이터 앞',
  },
};
