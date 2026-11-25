import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import GuideScreen from './GuideScreen';

/** W07 · 지도 길안내 / W09 · 층 이동(승강장 분기) */
export default function GuidePage() {
  return (
    <Suspense fallback={<ScreenFallback title="길안내" />}>
      <GuideScreen />
    </Suspense>
  );
}
