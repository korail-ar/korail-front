import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Button from '@/components/Button/Button';
import CheckpointMarker from '@/components/CheckpointMarker/CheckpointMarker';
import LandmarkRow from '@/components/LandmarkRow/LandmarkRow';
import SitePhotoMarker from '@/components/SitePhotoMarker/SitePhotoMarker';

import GuidanceSheet from './GuidanceSheet';

describe('GuidanceSheet', () => {
  it('제목을 영역 이름과 제목으로 쓰고, 넘긴 부분만 그린다', () => {
    render(
      <GuidanceSheet
        eyebrow="다음 확인 지점"
        title="맞이방 통로 끝"
        primaryAction={<Button>다음 단계</Button>}
      />,
    );
    expect(screen.getByRole('region', { name: '맞이방 통로 끝' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '맞이방 통로 끝' })).toBeInTheDocument();
    expect(screen.getByText('다음 확인 지점')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeInTheDocument();
    expect(screen.queryByText(/QR에서 위치/)).not.toBeInTheDocument();
  });
});

describe('LandmarkRow', () => {
  it('화면 낭독기에는 몇 번째 지점인지 함께 읽힌다', () => {
    render(
      <ol>
        <LandmarkRow number={2} title="플라잉스콘 통과" />
      </ol>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('2번째 지점: 플라잉스콘 통과');
  });
});

describe('SitePhotoMarker', () => {
  it('어느 지점의 사진인지 버튼 이름으로 알려준다', () => {
    render(<SitePhotoMarker src="/landmarks/flying-scone.png" placeName="플라잉스콘" />);
    expect(screen.getByRole('button', { name: '플라잉스콘 현장 사진 보기' })).toBeInTheDocument();
  });
});

describe('CheckpointMarker', () => {
  it('다음 구간 방향으로 화살표를 돌린다', () => {
    const { container } = render(<CheckpointMarker direction={90} />);
    expect(container.querySelector('[style]')).toHaveStyle({ rotate: '90deg' });
  });
});
