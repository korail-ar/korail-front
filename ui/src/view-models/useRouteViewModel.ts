'use client';

import { useRouter } from 'next/navigation';

import { JOURNEY_KEYS } from '@/lib/station/data';
import getJourneyMapLayers from '@/lib/station/mapLayers';
import useJourney from '@/lib/station/useJourney';

export default function useRouteViewModel() {
  const router = useRouter();
  const journey = useJourney();
  const { destination, route, href, platformNumber } = journey;

  return {
    journey,
    canGuide: journey.status === 'ok' && Boolean(destination && route),
    mapLayers: getJourneyMapLayers(journey),
    backHref: href(platformNumber ? '/platform' : '/search', {}, JOURNEY_KEYS),
    startGuide: () => router.push(href('/guide', { step: 0 }, JOURNEY_KEYS)),
  };
}
