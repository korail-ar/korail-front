'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import StateMessage from '@/components/StateMessage/StateMessage';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import type { Journey } from '@/lib/station/useJourney';

interface RouteErrorProps {
  journey: Journey;
  /** '수동으로 선택' 뒤에 돌아올 화면 */
  returnPath: string;
}

const DESCRIPTIONS = {
  'no-destination': '목적지 정보를 찾지 못했어요.\n다른 목적지를 다시 골라 주세요.',
  'no-route': '이 목적지까지 이어진 길 정보가 아직 없어요.\n잠시 후 다시 시도해 주세요.',
  ok: '',
} as const;

/** W11 · 오류 · 출발지 재선택. 경로를 만들 수 없을 때 경로 화면들이 대신 보여준다. */
export default function RouteError({ journey, returnPath }: RouteErrorProps) {
  const router = useRouter();
  const { start, status, href } = journey;

  return (
    <>
      <AppBar title="문제가 발생했어요" backHref={href('/search')} />
      <ScreenBody>
        <StateMessage
          type="error"
          title="경로를 찾을 수 없어요"
          description={DESCRIPTIONS[status]}
          action={{
            label: '다시 시도',
            onClick: () => router.refresh(),
            variant: 'text',
            className: 'underline underline-offset-4',
          }}
          className="mt-2"
        />

        <h2 className="mt-10 text-subtitle text-ink">출발 위치 확인도 어려운가요?</h2>
        <p className="mt-2 text-body-sm whitespace-pre-line text-ink-sub">
          {'QR 인식에 실패했다면\n출발 위치를 수동으로 다시 선택해 주세요.'}
        </p>
        <section
          aria-label="지금 출발 위치"
          className="mt-4 flex items-start gap-4 rounded-lg border border-line bg-surface px-4 py-4"
        >
          <Icon name="qr" size={24} className="mt-3 text-ink" />
          <div className="flex flex-col gap-1.5">
            <p className="text-body-lg text-ink">{start.name}</p>
            <p className="text-note text-ink-sub">현장 표지판과 같은 위치인지 확인</p>
          </div>
        </section>
        <Link
          href={href('/start', { next: href(returnPath, {}, ['to', 'platform']) })}
          className={cn(buttonClassNames('secondary', true), 'mt-8')}
        >
          수동으로 선택
        </Link>
        <p className="mt-8 text-caption whitespace-pre-line text-ink-mute">
          {'안내가 중단되면 주변 안내 표지판이나\n역무원의 도움을 이용해 주세요.'}
        </p>
      </ScreenBody>
    </>
  );
}
