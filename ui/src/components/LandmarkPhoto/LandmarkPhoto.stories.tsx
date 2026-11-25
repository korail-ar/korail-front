import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import LandmarkPhoto from './LandmarkPhoto';

const meta = {
  title: 'Components/LandmarkPhoto',
  component: LandmarkPhoto,
  decorators: [
    (Story) => (
      <div className="w-[335px]">
        <Story />
      </div>
    ),
  ],
  args: {
    src: '/landmarks/flying-scone.png',
    alt: 'FLYING SCONE 간판이 보이는 3층 맞이방',
  },
} satisfies Meta<typeof LandmarkPhoto>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma "현장 사진 · 교체 가능"(300:4858) 예시 사진 */
export const Default: Story = {};
