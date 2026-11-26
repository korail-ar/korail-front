'use client';

import { useEffect, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const router = useRouter();
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

  useEffect(() => {
    if (state.status === 'ARRIVED') router.push(journey.href('/arrive', {}, JOURNEY_KEYS));
  }, [state.status, router, journey]);

  if (!current) return <RouteError journey={journey} returnPath="/route" />;
  const isLast = state.currentSegmentIndex === state.segments.length - 1;
  const endLabel = current.landmark?.name ?? (isLast ? journey.destinationLabel : '다음 확인 지점');

  return (
    <>
      <AppBar title={journey.destinationLabel} backHref={journey.href('/route', {}, JOURNEY_KEYS)} />
      <div className="px-5 pb-2 text-note text-ink-sub" aria-live="polite">
        {state.currentSegmentIndex + 1} / {state.segments.length}단계 · {current.floor}
      </div>
      <StepNavigationMap
        segment={current}
        previous={state.segments.slice(0, state.currentSegmentIndex)}
        endLabel={endLabel}
      />
      <ScreenBody variant="panel">
        <h2 className="mt-4 text-heading text-ink">{current.instruction}</h2>
        <p className="mt-2 text-body text-ink-sub">다음 확인 지점: {endLabel}</p>
        {current.floor !== current.targetFloor && (
          <p className="mt-2 text-note text-ink-sub">{current.targetFloor} 도착 후 다음 단계를 누르세요.</p>
        )}
        <p className="mt-2 text-note text-ink-sub">이 단계는 현재 위치를 자동으로 확인하지 않습니다.</p>
        <Button
          fullWidth
          className="mt-5"
          onClick={() => dispatch({ type: isLast ? 'COMPLETE_NAVIGATION' : 'NEXT_SEGMENT' })}
        >
          {isLast ? '도착 확인' : '다음 단계'}
        </Button>
        <Button
          variant="text"
          fullWidth
          className="mt-1"
          disabled={state.currentSegmentIndex === 0}
          onClick={() => dispatch({ type: 'PREVIOUS_SEGMENT' })}
        >
          이전 지점으로
        </Button>
        <Link
          href={journey.href('/guide/steps', { step: state.currentSegmentIndex }, JOURNEY_KEYS)}
          className={buttonClassNames('text', true)}
        >
          전체 단계 보기
        </Link>
      </ScreenBody>
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
