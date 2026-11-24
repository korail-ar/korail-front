import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Button from '@/components/Button/Button';
import ResultItem from '@/components/ResultItem/ResultItem';

import BottomSheet from './BottomSheet';

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  args: {
    title: '자주 찾는 곳',
    children: (
      <p className="text-caption text-ink-mute">
        내용 자리: 결과 목록 · FacilityCard · RouteSummary · StepItem 중 하나만 넣습니다.
      </p>
    ),
  },
  decorators: [
    (Story) => (
      <div className="flex h-80 w-[344px] items-end bg-map-ground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: { defaultExpanded: false },
};

export const WithList: Story = {
  args: {
    children: (
      <ul>
        <li>
          <ResultItem icon="toilet" name="화장실 (동쪽)" meta="3층 · 매장 A 옆" onClick={fn()} />
        </li>
        <li>
          <ResultItem icon="locker" name="물품보관함" meta="3층 · 화장실(동쪽) 옆" onClick={fn()} />
        </li>
      </ul>
    ),
    footer: <Button>전체 시설 보기</Button>,
  },
  decorators: [
    (Story) => (
      <div className="flex h-[420px] items-end">
        <Story />
      </div>
    ),
  ],
};
