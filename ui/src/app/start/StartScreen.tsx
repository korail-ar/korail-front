'use client';

import AppBar from '@/components/AppBar/AppBar';
import ResultItem from '@/components/ResultItem/ResultItem';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import { START_POINTS } from '@/lib/station/data';
import useStartViewModel from '@/view-models/useStartViewModel';

export default function StartScreen() {
  const vm = useStartViewModel();

  return (
    <>
      <AppBar title="출발 위치 선택" backHref={vm.backHref} />
      <ScreenBody>
        <h2 className="mt-3 text-screen-title text-ink">지금 어디에 계세요?</h2>
        <p className="mt-2 text-body-sm text-ink-sub">
          가까운 QR 안내판에 적힌 위치를 골라 주세요.
        </p>
        <ul aria-label="출발 위치" className="mt-5 flex flex-col">
          {START_POINTS.map((point) => (
            <li key={point.id}>
              <ResultItem
                icon="qr"
                name={point.name}
                meta={point.id === vm.startId ? '지금 출발 위치' : 'QR 안내판'}
                aria-current={point.id === vm.startId ? 'location' : undefined}
                onClick={() => vm.selectStart(point.id)}
              />
            </li>
          ))}
        </ul>
      </ScreenBody>
    </>
  );
}
