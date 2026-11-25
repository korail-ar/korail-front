import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import StepListScreen from './StepListScreen';

/** W08 · 랜드마크 단계 안내(전체 단계) */
export default function StepListPage() {
  return (
    <Suspense fallback={<ScreenFallback title="도보 단계 안내" />}>
      <StepListScreen />
    </Suspense>
  );
}
