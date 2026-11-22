import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import type { IconName } from '@/components/Icon/Icon';

import CategoryChip from './CategoryChip';

const meta = {
  title: 'Components/CategoryChip',
  component: CategoryChip,
  args: { icon: 'toilet', label: '화장실', onClick: fn() },
} satisfies Meta<typeof CategoryChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

const CATEGORIES: { id: string; icon: IconName; label: string }[] = [
  { id: 'toilet', icon: 'toilet', label: '화장실' },
  { id: 'locker', icon: 'locker', label: '보관함' },
  { id: 'ticket', icon: 'ticket', label: '매표' },
  { id: 'shop', icon: 'shop', label: '편의점' },
  { id: 'elevator', icon: 'elevator', label: '엘리베이터' },
];

function ChipRow() {
  const [selectedId, setSelectedId] = useState('toilet');

  return (
    <div className="flex w-96 gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map(({ id, icon, label }) => (
        <CategoryChip
          key={id}
          icon={icon}
          label={label}
          selected={id === selectedId}
          onClick={() => setSelectedId(id)}
        />
      ))}
    </div>
  );
}

/** 한 번에 하나만 선택. 가로 한 줄로 놓고 넘치면 가로로 스크롤한다. */
export const Row: Story = {
  render: () => <ChipRow />,
};
