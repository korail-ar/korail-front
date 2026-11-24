'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import StationMap from '@/components/StationMap/StationMap';
import StepItem, { type StepState } from '@/components/StepItem/StepItem';
import cn from '@/lib/cn';
import { JOURNEY_KEYS, ROUTE_MAP_CAPTION } from '@/lib/station/data';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import useJourney from '@/lib/station/useJourney';

import getNextStep from '../nextStep';

function stateOf(index: number, current: number): StepState {
  if (index < current) {
    return 'done';
  }
  return index === current ? 'current' : 'next';
}

export default function StepListScreen() {
  const journey = useJourney();
  const { destination, route, steps, stepIndex, status, href } = journey;

  if (status !== 'ok' || !destination || !route || steps.length === 0) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  const step = steps[stepIndex];
  const next = getNextStep(journey, '/guide/steps');

  return (
    <>
      <AppBar title="도보 단계 안내" backHref={href('/guide', { step: stepIndex }, JOURNEY_KEYS)} />
      <StationMap
        className="h-62"
        {...getJourneyMapLayers(journey)}
        stepPoint={stepIndex > 0 ? { point: step.points[0], step: stepIndex + 1 } : undefined}
        focus={step.points.length > 1 ? step.points : undefined}
        caption={ROUTE_MAP_CAPTION}
      />
      <div className="flex flex-col px-5 pb-8">
        <h2 className="mt-4.5 text-heading text-ink">주변 시설을 보며 이동하세요</h2>
        <ol aria-label="안내 단계" className="mt-4 flex flex-col gap-4">
          {steps.map((item, index) => (
            <StepItem
              // 단계는 경로에서 순서대로 만들어지고 순서가 바뀌지 않는다.
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              state={stateOf(index, stepIndex)}
              icon={item.icon}
              text={item.text}
              sub={item.sub}
            />
          ))}
        </ol>
        <Link href={next.href} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          {next.label}
        </Link>
      </div>
    </>
  );
}
