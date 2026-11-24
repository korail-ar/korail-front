import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import HomeScreen from './HomeScreen';

/** W01 · 지도 중심 메인(QR 출발점) */
export default function Home() {
  return (
    <Suspense fallback={<ScreenFallback title="대전역 길안내" />}>
      <HomeScreen />
    </Suspense>
  );
}
