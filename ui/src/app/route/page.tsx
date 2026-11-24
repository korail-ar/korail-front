import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import RouteScreen from './RouteScreen';

/** W06 · 경로 미리보기 */
export default function RoutePage() {
  return (
    <Suspense fallback={<ScreenFallback title="경로 확인" />}>
      <RouteScreen />
    </Suspense>
  );
}
