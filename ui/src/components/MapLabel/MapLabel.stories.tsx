import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapLabel from './MapLabel';

const meta = {
  title: 'Map/MapLabel',
  component: MapLabel,
  args: { label: '보관함' },
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-ground p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Facility: Story = {};

export const Strong: Story = {
  args: { variant: 'strong' },
};

export const Start: Story = {
  args: { variant: 'start' },
};
