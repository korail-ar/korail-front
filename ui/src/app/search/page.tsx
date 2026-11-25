import { Suspense } from 'react';

import ScreenFallback from '@/components/ScreenFallback/ScreenFallback';

import SearchScreen from './SearchScreen';

/** W04 · 홈 검색 결과 상태 */
export default function SearchPage() {
  return (
    <Suspense fallback={<ScreenFallback title="대전역 실내 길찾기" />}>
      <SearchScreen />
    </Suspense>
  );
}
