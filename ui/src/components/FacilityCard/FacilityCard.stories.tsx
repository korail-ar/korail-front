import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import FacilityCard from './FacilityCard';

const meta = {
  title: 'Components/FacilityCard',
  component: FacilityCard,
  args: {
    icon: 'locker',
    name: '물품보관함',
    floor: '3층',
    needsCheck: true,
    rows: [
      { id: 'location', icon: 'pin', text: '화장실(동쪽) 옆' },
      { id: 'time', icon: 'walk', text: '안내 시작 위치에서 약 1분' },
    ],
    onAction: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[330px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FacilityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Verified: Story = {
  args: { needsCheck: false },
};

export const LongName: Story = {
  args: {
    name: '서광장 무인 물품보관함 (대형)',
    rows: [
      { id: 'location', icon: 'pin', text: '서광장 출입구 2 옆' },
      { id: 'time', icon: 'walk', text: '안내 시작 위치에서 약 4분' },
      { id: 'hours', icon: 'info', text: '05:00 ~ 24:00 운영' },
    ],
  },
};
