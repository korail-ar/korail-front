'use client';

import { useRouter } from 'next/navigation';

import AppBar from '@/components/AppBar/AppBar';
import ResultItem from '@/components/ResultItem/ResultItem';
import { START_POINTS } from '@/lib/station/data';
import useJourney, { buildHref } from '@/lib/station/useJourney';

/** 같은 앱 안의 경로만 받는다(다른 사이트로 보내는 주소를 막는다). */
function safeNextPath(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function StartScreen() {
  const router = useRouter();
  const { params, start } = useJourney();
  const next = safeNextPath(params.get('next'));
  const [nextPath, nextQuery = ''] = next.split('?');

  const handleSelect = (id: string) => {
    router.push(
      buildHref(nextPath, new URLSearchParams(nextQuery), { start: id }, [
        'to',
        'platform',
        'q',
        'category',
        'step',
      ]),
    );
  };

  return (
    <>
      <AppBar title="출발 위치 선택" backHref={next} />
      <div className="flex flex-col px-5 pb-8">
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
                meta={point.id === start.id ? '지금 출발 위치' : 'QR 안내판'}
                aria-current={point.id === start.id ? 'location' : undefined}
                onClick={() => handleSelect(point.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
