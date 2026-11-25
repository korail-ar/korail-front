'use client';

import { useEffect, useState } from 'react';

import { findNode } from '@/lib/station/data';
import type { MapPoint } from '@/lib/station/types';
import useJourney from '@/lib/station/useJourney';

const QR_PHASE_MS = 1200;
const MAP_PHASE_MIN_MS = 900;
const ENTRY_SEEN_KEY = 'korail:entry-seen';

export type HomePhase = 'qr' | 'map' | 'done';

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
    // 저장소를 못 쓰면 다음 진입 시 로딩을 다시 보여준다.
  }
}

function useEntryPhase(isQrEntry: boolean, startId: string): HomePhase {
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

/** 홈의 일시적 지도 상태와 URL 기반 출발점을 화면에서 분리한다. */
export default function useHomeViewModel() {
  const { params, start, href } = useJourney();
  const phase = useEntryPhase(params.has('start'), start.id);
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const startNode = findNode(start.nodeId);
  const startPoint: MapPoint | null = startNode ? [startNode.x, startNode.y] : null;
  const startMarker = startPoint ? { point: startPoint, label: 'QR 출발점' } : undefined;

  return {
    phase,
    view,
    toggleView: () => setView((value) => (value === '3d' ? '2d' : '3d')),
    startName: start.name,
    startMarker,
    startHref: href('/start'),
    searchHref: href('/search'),
    platformHref: href('/platform'),
    href,
  };
}
