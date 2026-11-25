import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import SearchField from './SearchField';
import SearchFieldLink from './SearchFieldLink';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  decorators: [
    (Story) => (
      <div className="w-80 bg-map-ground p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 포커스되면 테두리와 돋보기가 파랗게 바뀐다. */
export const Focus: Story = {
  args: { autoFocus: true },
};

/** 지도 위에 띄울 때. 테두리 대신 그림자. */
export const Float: Story = {
  args: { floating: true },
};

function ControlledSearchField() {
  const [value, setValue] = useState('어디로 가시나요?');

  return (
    <SearchField
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClear={() => setValue('')}
    />
  );
}

/** 값이 있으면 지우기 버튼이 나온다. */
export const WithValue: Story = {
  render: () => <ControlledSearchField />,
};

/** 홈 패널(W01)처럼 검색 화면으로 넘어가는 링크. 모양은 기본 검색창과 같다. */
export const AsLink: StoryObj<typeof SearchFieldLink> = {
  render: () => <SearchFieldLink href="/search" placeholder="목적지나 시설 이름을 검색하세요" />,
};
