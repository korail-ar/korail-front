'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import RouteSummary from '@/components/RouteSummary/RouteSummary';
import StationMap from '@/components/StationMap/StationMap';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import { JOURNEY_KEYS, ROUTE_FLOOR_LABEL, ROUTE_MAP_CAPTION } from '@/lib/station/data';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import { roundMeters } from '@/lib/station/route';
import useJourney from '@/lib/station/useJourney';

export default function RouteScreen() {
  const router = useRouter();
  const journey = useJourney();
  const { destination, route, steps, platformNumber, start, status, href } = journey;

  if (status !== 'ok' || !destination || !route) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  const sameFloor = platformNumber ? '승강장은 층 이동' : '같은 층';

  return (
    <>
      <AppBar title="경로 확인" backHref={href(platformNumber ? '/platform' : '/search')} />
      <StationMap fill {...getJourneyMapLayers(journey)} caption={ROUTE_MAP_CAPTION} />
      <ScreenBody variant="panel">
        <RouteSummary
          from={start.name}
          to={
            platformNumber ? `${platformNumber}번 승강장 (${destination.name})` : destination.name
          }
          time={`약 ${route.minutes}분`}
          distance={`약 ${roundMeters(route.meters)}m · ${sameFloor}`}
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
        <Link href={href('/search')} className={cn(buttonClassNames('text', true), 'mt-4')}>
          다른 목적지 찾기
        </Link>
      </ScreenBody>
    </>
  );
}
