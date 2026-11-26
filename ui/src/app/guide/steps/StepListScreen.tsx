'use client';

import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import StepItem, { type StepState } from '@/components/StepItem/StepItem';
import { JOURNEY_KEYS } from '@/lib/station/data';
import { segmentsForRoute, type InstructionType } from '@/lib/station/navigation';
import useJourney from '@/lib/station/useJourney';

function stepIcon(type: InstructionType): 'turn-left' | 'turn-right' | 'arrow-up' {
  if (type === 'TURN_LEFT') return 'turn-left';
  if (type === 'TURN_RIGHT') return 'turn-right';
  return 'arrow-up';
}

function stepState(stepIndex: number, currentIndex: number): StepState {
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'next';
}

export default function StepListScreen() {
  const journey = useJourney();
  if (journey.status !== 'ok' || !journey.route || !journey.destination) {
    return <RouteError journey={journey} returnPath="/route" />;
  }
  const segments = segmentsForRoute(journey.route, journey.destination.name);
  const index = Math.min(Math.max(Number(journey.params.get('step')) || 0, 0), segments.length - 1);

  return (
    <>
      <AppBar title="전체 단계 안내" backHref={journey.href('/guide', { step: index }, JOURNEY_KEYS)} />
      <ScreenBody>
        <p className="mt-3 text-body text-ink-sub">각 단계는 다음 단계 버튼을 눌렀을 때만 진행됩니다.</p>
        <ol aria-label="안내 단계" className="mt-5 flex flex-col gap-4">
          {segments.map((segment, stepIndex) => (
            <StepItem
              key={segment.id}
              state={stepState(stepIndex, index)}
              icon={stepIcon(segment.instructionType)}
              text={segment.instruction}
              sub={`${segment.floor} · ${stepIndex + 1}/${segments.length}`}
            />
          ))}
        </ol>
        <Link
          href={journey.href('/guide', { step: index }, JOURNEY_KEYS)}
          className={`${buttonClassNames('primary', true)} mt-6`}
        >
          현재 단계로 돌아가기
        </Link>
      </ScreenBody>
    </>
  );
}
