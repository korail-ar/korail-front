import Image from 'next/image';

import AppBar from '@/components/AppBar/AppBar';
import cn from '@/lib/cn';

export type EntryPhase = 'qr' | 'map';

interface EntryLoadingProps {
  phase: EntryPhase;
  startName: string;
}

interface StatusRow {
  label: string;
  status: string;
  /** 진행 중이거나 끝난 줄은 파랑, 아직 기다리는 줄은 회색 */
  isActive: boolean;
}

const COPY: Record<EntryPhase, { illustration: string; title: string }> = {
  qr: { illustration: '/illustrations/qr-scan.svg', title: 'QR 정보를\n확인하고 있어요' },
  map: { illustration: '/illustrations/route-search.svg', title: '대전역 지도를\n준비하고 있어요' },
};

/**
 * QR로 들어왔을 때 홈 앞에 보이는 진입 로딩(Figma 282:2088 → 282:2125).
 * QR 정보 확인 → 실내 지도 준비 순서로 상태를 보여준다.
 */
export default function EntryLoading({ phase, startName }: EntryLoadingProps) {
  const { illustration, title } = COPY[phase];
  const description =
    phase === 'qr'
      ? '안내를 시작할 위치를 확인해요.\n잠시만 기다려 주세요.'
      : `${startName}에서 안내를 시작해요.\n목적지를 고를 수 있도록 지도를 불러와요.`;
  const rows: StatusRow[] = [
    { label: 'QR 정보 확인', status: phase === 'qr' ? '확인 중' : '완료', isActive: true },
    {
      label: '실내 지도 준비',
      status: phase === 'qr' ? '대기 중' : '불러오는 중',
      isActive: phase === 'map',
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <AppBar title="대전역 길안내" />
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-8 text-center"
      >
        <p className="mt-7 text-caption font-bold text-brand">AR려줄게</p>
        <Image
          // 단계가 바뀌면 새 그림을 바로 보이도록 요소를 새로 만든다(이전 그림이 남아 보이지 않게).
          key={illustration}
          src={illustration}
          alt=""
          width={280}
          height={220}
          unoptimized
          priority
          className="mt-4"
        />
        <h2 className="mt-6 text-headline whitespace-pre-line text-ink">{title}</h2>
        <p className="mt-3.5 text-body whitespace-pre-line text-ink-sub">{description}</p>
        <dl className="mt-7.5 w-full rounded-lg bg-brand-soft px-4 py-2 text-left">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                'flex items-center justify-between py-2.5',
                index > 0 && 'border-t border-line',
              )}
            >
              <dt
                className={cn(
                  'text-body-sm font-medium',
                  row.isActive ? 'text-ink' : 'text-ink-sub',
                )}
              >
                {row.label}
              </dt>
              <dd
                className={cn(
                  'text-caption font-bold',
                  row.isActive ? 'text-brand' : 'text-ink-sub',
                )}
              >
                {row.status}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-auto pt-8 text-caption text-ink-sub">QR 설치 위치를 기준으로 안내해요.</p>
      </div>
    </div>
  );
}
