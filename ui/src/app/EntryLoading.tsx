import Image from 'next/image';

import AppBar from '@/components/AppBar/AppBar';
import cn from '@/lib/cn';

export type EntryPhase = 'qr' | 'map';

interface EntryLoadingProps {
  phase: EntryPhase;
  startName: string;
}

const SCREENS = [
  {
    phase: 'qr',
    illustration: '/illustrations/qr-scan.svg',
    title: 'QR 정보를\n확인하고 있어요',
  },
  {
    phase: 'map',
    illustration: '/illustrations/route-search.svg',
    title: '대전역 지도를\n준비하고 있어요',
  },
] as const;

/** 두 Figma 진입 화면(282:2088, 282:2125)을 같은 자리에 겹쳐 부드럽게 전환한다. */
export default function EntryLoading({ phase, startName }: EntryLoadingProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="h-9 shrink-0" aria-hidden="true" />
      <AppBar title="대전역 길안내" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 text-center">
        <div className="relative min-h-[576px] shrink-0" role="status" aria-live="polite">
          {SCREENS.map((screen) => {
            const active = phase === screen.phase;
            const description =
              screen.phase === 'qr'
                ? '안내를 시작할 위치를 확인해요.\n잠시만 기다려 주세요.'
                : `${startName}에서 안내를 시작해요.\n목적지를 고를 수 있도록 지도를 불러와요.`;

            return (
              <div
                key={screen.phase}
                aria-hidden={!active}
                className={cn(
                  'entry-screen absolute inset-x-0 top-0 flex flex-col items-center',
                  active && 'entry-screen-active',
                )}
              >
                <p className="mt-7 text-caption font-bold text-brand">AR려줄게</p>
                <Image
                  src={screen.illustration}
                  alt=""
                  width={280}
                  height={220}
                  unoptimized
                  priority
                  className="mt-[18px]"
                />
                <h2 className="mt-6 text-headline whitespace-pre-line text-ink">{screen.title}</h2>
                <p className="mt-3.5 text-body whitespace-pre-line text-ink-sub">{description}</p>
                <dl className="mt-7.5 w-full rounded-lg bg-brand-soft px-4 py-2 text-left">
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-body-sm font-medium text-ink">QR 정보 확인</dt>
                    <dd className="text-caption font-bold text-brand">
                      {screen.phase === 'qr' ? '확인 중' : '완료'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line py-2.5">
                    <dt
                      className={cn(
                        'text-body-sm font-medium',
                        screen.phase === 'qr' ? 'text-ink-sub' : 'text-ink',
                      )}
                    >
                      실내 지도 준비
                    </dt>
                    <dd
                      className={cn(
                        'text-caption font-bold',
                        screen.phase === 'qr' ? 'text-ink-sub' : 'text-brand',
                      )}
                    >
                      {screen.phase === 'qr' ? '대기 중' : '불러오는 중'}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
        <p className="mt-auto shrink-0 pb-10 text-caption text-ink-sub">
          QR 설치 위치를 기준으로 안내해요.
        </p>
      </div>
      <div className="relative h-[42px] shrink-0" aria-hidden="true">
        <div className="absolute bottom-3 left-1/2 h-1 w-[120px] -translate-x-1/2 rounded-full bg-ink" />
      </div>
    </div>
  );
}
