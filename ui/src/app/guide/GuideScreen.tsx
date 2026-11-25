'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import JourneyMilestones from '@/components/JourneyMilestones/JourneyMilestones';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
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
  const { steps, stepIndex, destination, destinationLabel, href } = journey;
  const step = steps[stepIndex];
  const layers = getJourneyMapLayers(journey);
  const next = getNextStep(journey, '/guide');
  const connector = destination?.name ?? '승강장 연결통로';

  return (
    <>
      <AppBar
        title="층 이동이 필요해요"
        backHref={href('/guide', { step: Math.max(stepIndex - 1, 0) }, JOURNEY_KEYS)}
      />
      <StationMap
        fill
        route={layers.route}
        start={layers.start}
        floorPoint={layers.destination && { point: layers.destination.point, label: connector }}
        focus={step.points.length > 1 ? step.points : layers.route}
        caption={ROUTE_MAP_CAPTION}
      />
      <ScreenBody variant="panel">
        <Tag
          label={`${destinationLabel} 방향 · 3F → 승강장`}
          variant="info"
          className="mt-5 self-start bg-transparent"
        />
        <h2 className="mt-4 text-title text-ink">
          {`${withJosa(destinationLabel, '으로')} 내려가야 해요`}
        </h2>
        <p className="mt-3 text-body whitespace-pre-line text-ink-sub">
          {`${connector}의 계단·에스컬레이터나 승강기로\n승강장에 내려가 주세요.`}
        </p>
        <p className="mt-4 rounded-md border border-line bg-surface px-3 py-3 text-note whitespace-pre-line text-ink-sub">
          {'타는 곳 표지판을 확인한 뒤 계속해 주세요.\n승강기 C: 재확인 필요 · 경로 제외'}
        </p>
        <Link href={next.href} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          이동 후 계속하기
        </Link>
      </ScreenBody>
    </>
  );
}

/** W07 · 지도 길안내 */
export default function GuideScreen() {
  const journey = useJourney();
  const { destination, destinationLabel, route, steps, stepIndex, milestones, status, href } =
    journey;

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
      <AppBar title={`${withJosa(destinationLabel, '으로')} 가는 중`} backHref={backHref} />
      <StationMap
        fill
        {...layers}
        stepPoint={stepIndex > 0 ? { point: step.points[0], step: stepIndex + 1 } : undefined}
        focus={step.points.length > 1 ? step.points : undefined}
        caption={ROUTE_MAP_CAPTION}
      />
      <ScreenBody variant="panel">
        <JourneyMilestones
          milestones={milestones.milestones}
          current={milestones.currentFor(stepIndex)}
          className="mt-3.5"
        />
        <StepBar icon={step.icon} text={step.text} sub={step.sub} className="mt-3" />
        <p className="mt-5 text-body text-ink-sub">{step.detail}</p>
        <Link href={next.href} className={cn(buttonClassNames('primary', true), 'mt-5')}>
          {next.label}
        </Link>
        <Link
          href={href('/guide/steps', { step: stepIndex }, JOURNEY_KEYS)}
          className={cn(buttonClassNames('text', true), 'mt-1')}
        >
          전체 단계 보기
        </Link>
      </ScreenBody>
    </>
  );
}
