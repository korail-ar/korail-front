'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import JourneyMilestones from '@/components/JourneyMilestones/JourneyMilestones';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import StationMap from '@/components/StationMap/StationMap';
import StepItem, { type StepState } from '@/components/StepItem/StepItem';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import { ROUTE_MAP_CAPTION } from '@/lib/station/data';
import useGuideViewModel from '@/view-models/useGuideViewModel';

function stateOf(index: number, current: number): StepState {
  if (index < current) {
    return 'done';
  }
  return index === current ? 'current' : 'next';
}

export default function StepListScreen() {
  const vm = useGuideViewModel();
  const { destinationLabel, steps, stepIndex, milestones } = vm.journey;

  if (!vm.canGuide || !vm.step) {
    return <RouteError journey={vm.journey} returnPath="/route" />;
  }

  return (
    <>
      <AppBar title="도보 단계 안내" backHref={vm.guideHref} />
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
          className="mt-3"
        />
        <h2 className="mt-3.5 text-heading text-ink">주변 시설을 보며 이동하세요</h2>
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
        {/* 전체 단계를 본 뒤에는 바로 도착을 확인한다(Figma W08 · 2026-11-25). */}
        <Link href={vm.arriveHref} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          {`${destinationLabel} 도착 확인`}
        </Link>
      </ScreenBody>
    </>
  );
}
