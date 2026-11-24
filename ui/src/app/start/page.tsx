import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import StartScreen from './StartScreen';

/** 출발 위치(QR 안내판) 직접 선택. Figma 시안은 없고 W01 '변경'·W11 '수동으로 선택'에서 연다. */
export default function StartPage() {
  return (
    <Suspense fallback={<ScreenFallback title="출발 위치 선택" />}>
      <StartScreen />
    </Suspense>
  );
}
