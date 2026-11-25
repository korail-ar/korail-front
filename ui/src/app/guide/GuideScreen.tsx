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
import { ROUTE_MAP_CAPTION } from '@/lib/station/data';
import withJosa from '@/lib/station/josa';
import useGuideViewModel from '@/view-models/useGuideViewModel';

/** W09 · 층 이동이 필요할 때(승강장 경로의 마지막 단계) */
function FloorChangeView({ vm }: { vm: ReturnType<typeof useGuideViewModel> }) {
  const { destination, destinationLabel } = vm.journey;
  const connector = destination?.name ?? '승강장 연결통로';

  return (
    <>
      <AppBar title="층 이동이 필요해요" backHref={vm.floorBackHref} />
      <StationMap
        fill
        route={vm.mapLayers.route}
        start={vm.mapLayers.start}
        floorPoint={
          vm.mapLayers.destination && { point: vm.mapLayers.destination.point, label: connector }
        }
        focus={vm.focus ?? vm.mapLayers.route}
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
        <Link href={vm.next.href} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          이동 후 계속하기
        </Link>
      </ScreenBody>
    </>
  );
}

/** W07 · 지도 길안내 */
export default function GuideScreen() {
  const vm = useGuideViewModel();
  const { destinationLabel, stepIndex, milestones } = vm.journey;

  if (!vm.canGuide || !vm.step) {
    return <RouteError journey={vm.journey} returnPath="/route" />;
  }

  const { step } = vm;
  if (step.kind === 'floor') {
    return <FloorChangeView vm={vm} />;
  }

  return (
    <>
      <AppBar title={`${withJosa(destinationLabel, '으로')} 가는 중`} backHref={vm.backHref} />
      <StationMap
        fill
        {...vm.mapLayers}
        stepPoint={vm.stepPoint}
        focus={vm.focus}
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
        <Link href={vm.next.href} className={cn(buttonClassNames('primary', true), 'mt-5')}>
          {vm.next.label}
        </Link>
        <Link href={vm.listHref} className={cn(buttonClassNames('text', true), 'mt-1')}>
          전체 단계 보기
        </Link>
      </ScreenBody>
    </>
  );
}
