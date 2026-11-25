'use client';

import { useState } from 'react';

import { PLATFORMS, findPlatform } from '@/lib/station/data';
import useJourney from '@/lib/station/useJourney';

export default function usePlatformViewModel() {
  const { params, href } = useJourney();
  const [selected, setSelected] = useState(findPlatform(params.get('platform'))?.number ?? null);
  const platform = PLATFORMS.find((item) => item.number === selected);

  return {
    selected,
    selectPlatform: setSelected,
    platform,
    outOfService: PLATFORMS.filter((item) => !item.isInService).map((item) => item.number),
    backHref: href('/'),
    routeHref: platform
      ? href('/route', { to: platform.placeId, platform: platform.number })
      : null,
  };
}
