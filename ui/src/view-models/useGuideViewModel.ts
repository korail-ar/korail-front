'use client';

import { JOURNEY_KEYS } from '@/lib/station/data';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import useJourney from '@/lib/station/useJourney';

export default function useGuideViewModel() {
  const journey = useJourney();
  const { destination, destinationLabel, route, steps, stepIndex, href } = journey;
  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  return {
    journey,
    canGuide: journey.status === 'ok' && Boolean(destination && route && step),
    step,
    mapLayers: getJourneyMapLayers(journey),
    focus: step?.points.length > 1 ? step.points : undefined,
    stepPoint: step && stepIndex > 0 ? { point: step.points[0], step: stepIndex + 1 } : undefined,
    next: isLast
      ? { label: `${destinationLabel} 도착 확인`, href: href('/arrive', {}, JOURNEY_KEYS) }
      : { label: '다음 단계', href: href('/guide', { step: stepIndex + 1 }, JOURNEY_KEYS) },
    backHref:
      stepIndex > 0
        ? href('/guide', { step: stepIndex - 1 }, JOURNEY_KEYS)
        : href('/route', {}, JOURNEY_KEYS),
    floorBackHref: href('/guide', { step: Math.max(stepIndex - 1, 0) }, JOURNEY_KEYS),
    listHref: href('/guide/steps', { step: stepIndex }, JOURNEY_KEYS),
    guideHref: href('/guide', { step: stepIndex }, JOURNEY_KEYS),
    arriveHref: href('/arrive', {}, JOURNEY_KEYS),
  };
}
