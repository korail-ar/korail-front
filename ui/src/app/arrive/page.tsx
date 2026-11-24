import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import ArriveScreen from './ArriveScreen';

/** W10 · 도착 · 시설 정보 */
export default function ArrivePage() {
  return (
    <Suspense fallback={<ScreenFallback title="목적지에 도착했어요" />}>
      <ArriveScreen />
    </Suspense>
  );
}
