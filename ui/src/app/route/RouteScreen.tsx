'use client';

import AppBar from '@/components/AppBar/AppBar';
import JourneyMilestones from '@/components/JourneyMilestones/JourneyMilestones';
import RouteError from '@/components/RouteError/RouteError';
import RouteSummary from '@/components/RouteSummary/RouteSummary';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import StationMap from '@/components/StationMap/StationMap';
import { ROUTE_FLOOR_LABEL, ROUTE_MAP_CAPTION } from '@/lib/station/data';
import { segmentsForRoute } from '@/lib/station/navigation';
import useRouteViewModel from '@/view-models/useRouteViewModel';

/** W06 · 경로 미리보기 */
export default function RouteScreen() {
  const vm = useRouteViewModel();
  const { destination, route, milestones, destinationLabel, start } = vm.journey;

  if (!vm.canGuide || !destination) {
    return <RouteError journey={vm.journey} returnPath="/route" />;
  }

  const segmentCount = route ? segmentsForRoute(route, destination.name).length : 0;

  return (
    <>
      <AppBar title={`${destinationLabel}까지 경로 확인`} backHref={vm.backHref} />
      <StationMap fill {...vm.mapLayers} caption={ROUTE_MAP_CAPTION} />
      <ScreenBody variant="panel">
        <JourneyMilestones milestones={milestones.milestones} current={0} className="mt-4" />
        <RouteSummary
          from={start.name}
          to={destinationLabel}
          // 거리·시간은 현장 확인 전이라 단계 수만 보여준다(Figma W06 · 2026-11-25).
          time={`${segmentCount}단계 안내`}
          distance={`${ROUTE_FLOOR_LABEL} · 거리·시간 확인 예정`}
          stepCount={segmentCount}
          floor={ROUTE_FLOOR_LABEL}
          onAction={vm.startGuide}
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
