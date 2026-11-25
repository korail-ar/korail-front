'use client';

import { useRouter } from 'next/navigation';

import AppBar from '@/components/AppBar/AppBar';
import JourneyMilestones from '@/components/JourneyMilestones/JourneyMilestones';
import RouteError from '@/components/RouteError/RouteError';
import RouteSummary from '@/components/RouteSummary/RouteSummary';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import StationMap from '@/components/StationMap/StationMap';
import { JOURNEY_KEYS, ROUTE_FLOOR_LABEL, ROUTE_MAP_CAPTION } from '@/lib/station/data';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import useJourney from '@/lib/station/useJourney';

/** W06 · 경로 미리보기 */
export default function RouteScreen() {
  const router = useRouter();
  const journey = useJourney();
  const { destination, route, steps, milestones, destinationLabel, start, status, href } = journey;

  if (status !== 'ok' || !destination || !route) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  return (
    <>
      <AppBar
        title={`${destinationLabel}까지 경로 확인`}
        backHref={href(journey.platformNumber ? '/platform' : '/search', {}, JOURNEY_KEYS)}
      />
      <StationMap fill {...getJourneyMapLayers(journey)} caption={ROUTE_MAP_CAPTION} />
      <ScreenBody variant="panel">
        <JourneyMilestones milestones={milestones.milestones} current={0} className="mt-4" />
        <RouteSummary
          from={start.name}
          to={destinationLabel}
          // 거리·시간은 현장 확인 전이라 단계 수만 보여준다(Figma W06 · 2026-11-25).
          time={`${steps.length}단계 안내`}
          distance={`${ROUTE_FLOOR_LABEL} · 거리·시간 확인 예정`}
          stepCount={steps.length}
          floor={ROUTE_FLOOR_LABEL}
          onAction={() => router.push(href('/guide', { step: 0 }, JOURNEY_KEYS))}
          className="mt-4"
        />
        {destination.isApproximate && (
          <p className="mt-2 text-note text-ink-sub">
            시설 입구 정보가 없어 가장 가까운 통로까지 안내해요.
          </p>
        )}
      </ScreenBody>
    </>
  );
}
