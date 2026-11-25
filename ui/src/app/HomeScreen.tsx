'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import AppBar from '@/components/AppBar/AppBar';
import BottomSheet from '@/components/BottomSheet/BottomSheet';
import Button, { buttonClassNames } from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import SearchFieldLink from '@/components/SearchField/SearchFieldLink';
import StationMap from '@/components/StationMap/StationMap';
import StationMap3D from '@/components/StationMap3D/StationMap3D';
import { QUICK_FILTERS, findNode } from '@/lib/station/data';
import type { MapPoint } from '@/lib/station/types';
import useJourney from '@/lib/station/useJourney';

import EntryLoading, { type EntryPhase } from './EntryLoading';
import QuickFilterLinks from './QuickFilterLinks';

// 지도 위 출발 위치 카드(64px + 위 여백)를 피해서 시작 위치를 가운데 둔다.
const START_CARD_INSET = 84;
// 진입 로딩 단계별 최소 표시 시간(ms). 너무 빨리 넘어가면 무엇을 확인했는지 읽을 수 없다.
const QR_PHASE_MS = 1200;
const MAP_PHASE_MIN_MS = 900;
// 같은 탭에서 같은 QR로 다시 들어오면 진입 로딩을 건너뛴다.
const ENTRY_SEEN_KEY = 'korail:entry-seen';

type HomePhase = EntryPhase | 'done';

function readEntrySeen(): string | null {
  try {
    return window.sessionStorage.getItem(ENTRY_SEEN_KEY);
  } catch {
    return null;
  }
}

function writeEntrySeen(startId: string) {
  try {
    window.sessionStorage.setItem(ENTRY_SEEN_KEY, startId);
  } catch {
    // 저장소를 못 쓰면 다음에 다시 로딩을 보여줄 뿐이다.
  }
}

/** QR로 들어왔을 때(주소에 start가 있을 때)만 진입 로딩을 보여준다. */
function useEntryPhase(isQrEntry: boolean, startId: string): HomePhase {
  // 이 화면은 주소를 읽는 Suspense 안이라 브라우저에서만 그려지므로 sessionStorage를 바로 읽어도 된다.
  const [phase, setPhase] = useState<HomePhase>(() =>
    isQrEntry && readEntrySeen() !== startId ? 'qr' : 'done',
  );

  useEffect(() => {
    if (phase === 'qr') {
      const timer = setTimeout(() => setPhase('map'), QR_PHASE_MS);
      return () => clearTimeout(timer);
    }
    if (phase !== 'map') {
      return undefined;
    }
    // 지도 그림을 미리 받아 두고, 최소 시간이 지나면 홈으로 넘어간다.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    const finish = () => {
      timer = setTimeout(
        () => {
          writeEntrySeen(startId);
          setPhase('done');
        },
        Math.max(0, MAP_PHASE_MIN_MS - (Date.now() - startedAt)),
      );
    };
    const image = new window.Image();
    image.onload = finish;
    image.onerror = finish;
    image.src = '/maps/web-3F-map.svg';
    return () => {
      image.onload = null;
      image.onerror = null;
      clearTimeout(timer);
    };
  }, [phase, startId]);

  return phase;
}

export default function HomeScreen() {
  const { params, start, href } = useJourney();
  const phase = useEntryPhase(params.has('start'), start.id);
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const startNode = findNode(start.nodeId);
  const startPoint: MapPoint | null = startNode ? [startNode.x, startNode.y] : null;
  const startMarker = startPoint ? { point: startPoint, label: 'QR 출발점' } : undefined;

  if (phase !== 'done') {
    return <EntryLoading phase={phase} startName={start.name} />;
  }

  const viewToggle = (
    <Button
      variant="secondary"
      onClick={() => setView((value) => (value === '3d' ? '2d' : '3d'))}
      className="w-23 shrink-0 px-0"
    >
      {view === '3d' ? '2D 보기' : '3D 보기'}
    </Button>
  );

  return (
    <>
      <AppBar title="대전역 길안내" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {view === '3d' ? (
          <StationMap3D
            className="min-h-40 flex-1 basis-0"
            start={startMarker}
            toolbarStart={viewToggle}
          />
        ) : (
          <StationMap
            fill
            start={startMarker}
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
            <p className="truncate text-body-lg text-ink">{start.name}</p>
          </div>
          <Link href={href('/start')} className={buttonClassNames('text')}>
            변경
          </Link>
        </section>

        <BottomSheet
          title="어디로 가시나요?"
          titleClassName="text-headline"
          className="relative z-10 -mt-3 min-h-0 overflow-y-auto rounded-t-xl border border-b-0 border-line shadow-none"
        >
          <SearchFieldLink href={href('/search')} placeholder="목적지나 시설 이름을 검색하세요" />
          <Link href={href('/platform')} className={buttonClassNames('primary', true)}>
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
