'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import StationMap from '@/components/StationMap/StationMap';
import StepBar from '@/components/StepBar/StepBar';
import Tag from '@/components/Tag/Tag';
import cn from '@/lib/cn';
import { JOURNEY_KEYS, ROUTE_MAP_CAPTION } from '@/lib/station/data';
import withJosa from '@/lib/station/josa';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import useJourney, { type Journey } from '@/lib/station/useJourney';

import getNextStep from './nextStep';

/** W09 · 층 이동이 필요할 때(승강장 경로의 마지막 단계) */
function FloorChangeView({ journey }: { journey: Journey }) {
  const { steps, stepIndex, platformNumber, href } = journey;
  const step = steps[stepIndex];
  const layers = getJourneyMapLayers(journey);
  const next = getNextStep(journey, '/guide');

  return (
    <>
      <AppBar
        title="층 이동이 필요해요"
        backHref={href('/guide', { step: Math.max(stepIndex - 1, 0) }, JOURNEY_KEYS)}
      />
      <StationMap
        className="h-70"
        route={layers.route}
        isTransferRoute
        start={layers.start}
        floorPoint={
          layers.destination && {
            point: layers.destination.point,
            label: `${platformNumber}번 승강장 연결 지점`,
            icon: 'stairs',
          }
        }
        focus={step.points.length > 1 ? step.points : layers.route}
        caption={ROUTE_MAP_CAPTION}
      />
      <div className="flex flex-col px-5 pb-8">
        <Tag
          label="승강장 경로 · 층 이동"
          variant="info"
          className="mt-5 self-start bg-transparent px-0"
        />
        <h2 className="mt-4 text-title text-ink">{`${platformNumber}번 승강장으로 내려가야 해요`}</h2>
        <p className="mt-3 text-body whitespace-pre-line text-ink-sub">
          {'가까운 계단·에스컬레이터나 승강기를 이용해\n승강장으로 내려가 주세요.'}
        </p>
        <p className="mt-4 rounded-md border border-line bg-surface px-3 py-3 text-note whitespace-pre-line text-ink-sub">
          {'타는 곳 안내 표지판을 먼저 확인해 주세요.\n이동을 마친 뒤 아래 버튼을 눌러 주세요.'}
        </p>
        <Link href={next.href} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          이동 후 계속하기
        </Link>
      </div>
    </>
  );
}

export default function GuideScreen() {
  const journey = useJourney();
  const { destination, route, steps, stepIndex, status, href } = journey;

  if (status !== 'ok' || !destination || !route || steps.length === 0) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  const step = steps[stepIndex];
  if (step.kind === 'floor') {
    return <FloorChangeView journey={journey} />;
  }

  const layers = getJourneyMapLayers(journey);
  const next = getNextStep(journey, '/guide');
  const backHref =
    stepIndex > 0
      ? href('/guide', { step: stepIndex - 1 }, JOURNEY_KEYS)
      : href('/route', {}, JOURNEY_KEYS);

  return (
    <>
      <AppBar title={`${withJosa(destination.name, '으로')} 가는 중`} backHref={backHref} />
      <StationMap
        className="h-82"
        {...layers}
        stepPoint={stepIndex > 0 ? { point: step.points[0], step: stepIndex + 1 } : undefined}
        focus={step.points.length > 1 ? step.points : undefined}
        caption={ROUTE_MAP_CAPTION}
      />
      <div className="flex flex-col px-5 pb-8">
        <StepBar icon={step.icon} text={step.text} sub={step.sub} className="mt-4.5" />
        <p className="mt-6 text-caption font-bold text-brand-press">
          {`${stepIndex + 1} / ${steps.length}단계`}
        </p>
        <p className="mt-3 text-body text-ink-sub">{step.detail}</p>
        <Link href={next.href} className={cn(buttonClassNames('primary', true), 'mt-7')}>
          {next.label}
        </Link>
        <Link
          href={href('/guide/steps', { step: stepIndex }, JOURNEY_KEYS)}
          className={cn(buttonClassNames('text', true), 'mt-2')}
        >
          전체 단계 보기
        </Link>
      </div>
    </>
  );
}
