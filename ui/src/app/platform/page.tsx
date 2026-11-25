import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import PlatformScreen from './PlatformScreen';

/** W05 · 승강장 번호 선택 */
export default function PlatformPage() {
  return (
    <Suspense fallback={<ScreenFallback title="승강장 번호 선택" />}>
      <PlatformScreen />
    </Suspense>
  );
}
