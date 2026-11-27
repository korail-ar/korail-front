'use client';

import AppBar from '@/components/AppBar/AppBar';
import StationMap from '@/components/StationMap/StationMap';
import useHomeViewModel from '@/view-models/useHomeViewModel';

import EntryLoading from './EntryLoading';
import HomeSearchSheet from './HomeSearchSheet';

// 지도 위 출발 위치 카드(64px + 위 여백)를 피해서 시작 위치를 가운데 둔다.
const START_CARD_INSET = 84;
export default function HomeScreen() {
  const vm = useHomeViewModel();

  if (vm.phase !== 'done') {
    return <EntryLoading phase={vm.phase} startName={vm.startName} />;
  }

  return (
    <div className="home-enter flex min-h-0 flex-1 flex-col">
      <AppBar title="대전역 길안내" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {vm.view === '3d' ? (
          <div className="relative min-h-40 flex-1 basis-0 overflow-hidden bg-[#e2f6f2]">
            <iframe
              src="/3d-reference.html?homeEmbed=1"
              title="대전역 3D 층별 지도"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        ) : (
          <StationMap
            fill
            start={vm.startMarker}
            focusInsets={{ top: START_CARD_INSET, bottom: 72, left: 24, right: 24 }}
            showFloorControl={false}
            showZoomControl={false}
            recenterPlacement="bottom-right"
          />
        )}
        <HomeSearchSheet view={vm.view} onToggleView={vm.toggleView} />
      </div>
    </div>
  );
}
