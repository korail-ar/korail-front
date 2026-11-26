'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import AppBar from '@/components/AppBar/AppBar';
import Button, { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import StepNavigationMap from '@/components/StepNavigationMap/StepNavigationMap';
import { JOURNEY_KEYS } from '@/lib/station/data';
import { segmentsForRoute } from '@/lib/station/navigation';
import { navigationReducer } from '@/lib/station/navigationState';
import useJourney, { type Journey } from '@/lib/station/useJourney';

function NavigationSession({ journey }: { journey: Journey }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segments = useMemo(
    () => journey.route ? segmentsForRoute(journey.route, journey.destination?.name) : [],
    [journey.route, journey.destination],
  );
  const [state, dispatch] = useReducer(navigationReducer, {
    status: 'NAVIGATING',
    segments,
    currentSegmentIndex: Math.min(
      Math.max(Number(journey.params.get('step')) || 0, 0),
      Math.max(segments.length - 1, 0),
    ),
  });
  const current = state.segments[state.currentSegmentIndex];
  const isLast = current?.isLastStep ?? false;

  const advance = useCallback(() => {
    if (isTransitioning) return;
    dispatch({ type: isLast ? 'CONFIRM_ARRIVAL' : 'NEXT_STEP' });
    if (!isLast && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === false) {
      setIsTransitioning(true);
      transitionTimer.current = setTimeout(() => setIsTransitioning(false), 450);
    }
  }, [isTransitioning, isLast]);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  if (!current) return <RouteError journey={journey} returnPath="/route" />;
  const previous = state.segments[state.currentSegmentIndex - 1];
  const next = state.segments[state.currentSegmentIndex + 1];
  const endLabel = isLast ? journey.destinationLabel : current.checkpointName;
  const startLabel = previous
    ? `확인한 스팟 · ${previous.checkpointName}`
    : `${journey.start.name} · 출발점`;
  const startAgainHref = journey.href('/start', {
    next: journey.href('/guide', { step: 0 }, JOURNEY_KEYS),
  }, JOURNEY_KEYS);

  return (
    <>
      <AppBar
        title={`${journey.destinationLabel}까지 · ${state.currentSegmentIndex + 1} / ${state.segments.length}`}
        backHref={journey.href('/route', {}, JOURNEY_KEYS)}
      />
      <div className="relative flex min-h-40 flex-1 basis-0">
        <StepNavigationMap
          segment={current}
          previous={state.segments.slice(0, state.currentSegmentIndex)}
          next={next}
          startLabel={startLabel}
          endLabel={endLabel}
        />
        <div className="pointer-events-none absolute inset-x-5 top-5 z-20 rounded-[18px] bg-brand/90 px-4 py-3.5 text-on-color">
          <h2 className="text-[17px] leading-6 font-bold">{current.instruction}</h2>
          <p className="mt-1 text-xs leading-[18px]">
            {isLast ? '목적지 표지판을 확인해 주세요.' : '안내된 지점을 확인하면 다음 단계로 진행하세요.'}
          </p>
        </div>
      </div>
      <ScreenBody variant="panel" className="rounded-t-[26px] border-t border-line bg-surface pt-[18px]">
        <p className="text-xs text-ink-sub">{isLast ? '마지막 확인 지점' : '다음 확인 지점'}</p>
        <h2 className="mt-2 text-[23px] leading-[35px] font-bold text-ink">{endLabel}</h2>
        <p className="mt-2 text-xs leading-[18px] text-ink-sub">
          {isLast ? '현장 표지판에서 목적지를 확인해 주세요.' : '해당 지점에 도착한 뒤 눌러주세요. 다음 구간이 화면 위쪽으로 정렬돼요.'}
        </p>
        {current.needsDataReview && (
          <p className="mt-2 text-xs text-ink-sub">이 구간은 평면도에서 통로 연결 확인이 필요합니다.</p>
        )}
        {current.floor !== current.targetFloor && (
          <p className="mt-2 text-xs text-ink-sub">{current.targetFloor} 도착 후 다음 단계를 누르세요.</p>
        )}
        <Button fullWidth className="mt-4" disabled={isTransitioning} onClick={advance}>
          {isLast ? '도착했어요' : '다음 단계'}
        </Button>
        {state.currentSegmentIndex === 0 ? (
          <Link href={startAgainHref} className={`${buttonClassNames('text', true)} mt-1`}>
            시작 위치 다시 확인
          </Link>
        ) : (
          <Button
            variant="text"
            fullWidth
            className="mt-1"
            disabled={isTransitioning}
            onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
          >
            이전 지점으로
          </Button>
        )}
        <Link
          href={journey.href('/guide/steps', { step: state.currentSegmentIndex }, JOURNEY_KEYS)}
          className={`${buttonClassNames('text', true)} mt-1`}
        >
          전체 단계 보기
        </Link>
      </ScreenBody>
      {state.status === 'ARRIVED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 px-5" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="arrival-title" className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
            <h2 id="arrival-title" className="text-heading text-ink">목적지에 도착했어요</h2>
            <p className="mt-2 text-body text-ink-sub">{journey.destinationLabel} · {current.targetFloor}</p>
            <Link href={journey.href('/search', {}, ['start'])} className={`${buttonClassNames('primary', true)} mt-6`}>
              다른 목적지 찾기
            </Link>
            <Button
              variant="text"
              fullWidth
              className="mt-1"
              onClick={() => {
                dispatch({ type: 'RESET_NAVIGATION' });
                dispatch({ type: 'START_NAVIGATION' });
              }}
            >
              길안내 다시 보기
            </Button>
          </section>
        </div>
      )}
    </>
  );
}

export default function GuideScreen() {
  const journey = useJourney();
  if (journey.status !== 'ok' || !journey.route || !journey.destination) {
    return <RouteError journey={journey} returnPath="/route" />;
  }
  return <NavigationSession key={`${journey.start.id}-${journey.destination.id}`} journey={journey} />;
}
