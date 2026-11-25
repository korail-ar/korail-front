import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import SitePhotoMarker from './SitePhotoMarker';

const meta = {
  title: 'Map/SitePhotoMarker',
  component: SitePhotoMarker,
  decorators: [
    (Story) => (
      <div className="inline-flex bg-map-ground p-4">
        <Story />
      </div>
    ),
  ],
  args: { src: '/landmarks/flying-scone.png', placeName: '플라잉스콘' },
} satisfies Meta<typeof SitePhotoMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 지도 위 "현장 사진 보기" 썸네일(300:4441). 누르면 큰 사진 패널을 연다. */
export const Default: Story = {};
