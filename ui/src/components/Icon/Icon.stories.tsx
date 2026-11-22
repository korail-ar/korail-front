import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Icon, { ICON_NAMES } from './Icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  args: { name: 'search', size: 24 },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: 'select', options: [14, 16, 18, 20, 24, 28] },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Colored: Story = {
  args: { name: 'pin', className: 'text-brand-press' },
};

/** 24 그리드 · 2px 선 · 둥근 끝. 임시 그림이며 역 안내 픽토그램과 맞춰봐야 한다. */
export const All: Story = {
  render: () => (
    <ul className="grid w-[640px] grid-cols-[repeat(16,24px)] gap-4">
      {ICON_NAMES.map((name) => (
        <li key={name} title={name}>
          <Icon name={name} label={name} />
        </li>
      ))}
    </ul>
  ),
};
