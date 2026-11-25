'use client';

import { CATEGORY_INFO, JOURNEY_KEYS } from '@/lib/station/data';
import { pickJosa } from '@/lib/station/josa';
import useJourney from '@/lib/station/useJourney';

export default function useArriveViewModel() {
  const journey = useJourney();
  const { destination, destinationLabel, route, steps, href } = journey;

  return {
    journey,
    canArrive: journey.status === 'ok' && Boolean(destination && route),
    category: destination ? CATEGORY_INFO[destination.category] : undefined,
    confirmation: `현장 표지판에서 ‘${destinationLabel}’${pickJosa(destinationLabel, '을')} 확인해 주세요.`,
    backHref: href('/guide', { step: Math.max(steps.length - 1, 0) }, JOURNEY_KEYS),
    searchHref: href('/search'),
    homeHref: href('/'),
  };
}
