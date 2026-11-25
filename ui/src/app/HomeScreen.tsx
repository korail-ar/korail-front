'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import BottomSheet from '@/components/BottomSheet/BottomSheet';
import Button, { buttonClassNames } from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import SearchFieldLink from '@/components/SearchField/SearchFieldLink';
import StationMap from '@/components/StationMap/StationMap';
import StationMap3D from '@/components/StationMap3D/StationMap3D';
import { QUICK_FILTERS } from '@/lib/station/data';
import useHomeViewModel from '@/view-models/useHomeViewModel';

import EntryLoading from './EntryLoading';
import QuickFilterLinks from './QuickFilterLinks';

// 지도 위 출발 위치 카드(64px + 위 여백)를 피해서 시작 위치를 가운데 둔다.
const START_CARD_INSET = 84;
export default function HomeScreen() {
  const vm = useHomeViewModel();

  if (vm.phase !== 'done') {
    return <EntryLoading phase={vm.phase} startName={vm.startName} />;
  }

  const viewToggle = (
    <Button variant="secondary" onClick={vm.toggleView} className="w-23 shrink-0 px-0">
      {vm.view === '3d' ? '2D 보기' : '3D 보기'}
    </Button>
  );

  return (
    <>
      <AppBar title="대전역 길안내" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {vm.view === '3d' ? (
          <StationMap3D
            className="min-h-40 flex-1 basis-0"
            start={vm.startMarker}
            toolbarStart={viewToggle}
          />
        ) : (
          <StationMap
            fill
            start={vm.startMarker}
            focusInsets={{ top: START_CARD_INSET, bottom: 72, left: 24, right: 24 }}
            showFloorControl={false}
            showZoomControl={false}
            recenterPlacement="bottom-right"
            overlay={<div className="absolute bottom-4 left-5">{viewToggle}</div>}
          />
        )}
        <section
          aria-label="출발 위치"
          className="absolute top-1 right-5 left-5 flex h-16 items-center justify-between rounded-lg border border-brand-tint bg-surface pr-2 pl-4"
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-note text-ink-sub">QR 출발점</p>
            <p className="truncate text-body-lg text-ink">{vm.startName}</p>
          </div>
          <Link href={vm.startHref} className={buttonClassNames('text')}>
            변경
          </Link>
        </section>

        <BottomSheet
          title="어디로 가시나요?"
          titleClassName="text-headline"
          className="relative z-10 -mt-3 min-h-0 overflow-y-auto rounded-t-xl border border-b-0 border-line shadow-none"
        >
          <SearchFieldLink href={vm.searchHref} placeholder="목적지나 시설 이름을 검색하세요" />
          <Link href={vm.platformHref} className={buttonClassNames('primary', true)}>
            <Icon name="train" size={20} />
            타는 곳 번호로 찾기
          </Link>
          <QuickFilterLinks filters={QUICK_FILTERS} href={vm.href} />
          <p className="text-note text-ink-sub">QR 출발점 기준 · 실시간 위치가 아니에요</p>
        </BottomSheet>
      </div>
    </>
  );
}
