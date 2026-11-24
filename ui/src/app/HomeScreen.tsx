'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import BottomSheet from '@/components/BottomSheet/BottomSheet';
import { buttonClassNames } from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import StationMap from '@/components/StationMap/StationMap';
import cn from '@/lib/cn';
import { QUICK_FILTERS, ROUTE_FLOOR_LABEL, findNode } from '@/lib/station/data';
import useJourney from '@/lib/station/useJourney';

import QuickFilterLinks from './QuickFilterLinks';

// 지도 위 출발 위치 카드(64px + 위 여백)를 피해서 시작 위치를 가운데 둔다.
const START_CARD_INSET = 84;

export default function HomeScreen() {
  const { start, href } = useJourney();
  const startNode = findNode(start.nodeId);
  const startPoint = startNode ? ([startNode.x, startNode.y] as const) : null;

  return (
    <>
      <AppBar title="대전역 길안내" />
      <div className="relative flex flex-1 flex-col">
        <StationMap
          className="min-h-75 flex-1"
          start={startPoint ? { point: startPoint, label: start.name } : undefined}
          focusInsets={{ top: START_CARD_INSET, bottom: 32, left: 24, right: 24 }}
          caption={`${ROUTE_FLOOR_LABEL} 지도`}
          showFloorControl={false}
          showZoomControl={false}
          recenterPlacement="bottom-right"
        />
        <section
          aria-label="출발 위치"
          className="absolute top-1 right-5 left-5 flex h-16 items-center justify-between rounded-lg border border-line bg-surface pr-2 pl-4"
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-note text-ink-sub">QR 출발점</p>
            <p className="truncate text-body-lg text-ink">{start.name}</p>
          </div>
          <Link href={href('/start')} className={buttonClassNames('text')}>
            변경
          </Link>
        </section>

        <BottomSheet
          title="어디로 가시나요?"
          titleClassName="text-screen-title"
          className="relative z-10 -mt-3 rounded-t-xl border border-b-0 border-line shadow-none"
        >
          <Link
            href={href('/search')}
            className={cn(
              'flex h-13 w-full items-center gap-3 rounded-md border-[1.5px] border-line-strong bg-surface px-4',
              'text-body text-ink-mute transition-colors active:bg-surface-sunken',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            )}
          >
            <Icon name="search" size={20} />
            목적지나 시설 이름을 검색하세요
          </Link>
          <Link href={href('/platform')} className={buttonClassNames('secondary', true)}>
            <Icon name="train" size={20} />
            타는 곳 번호로 찾기
          </Link>
          <QuickFilterLinks filters={QUICK_FILTERS} href={href} />
          <p className="text-note text-ink-sub">QR 출발점 기준 · 실시간 위치가 아니에요</p>
        </BottomSheet>
      </div>
    </>
  );
}
