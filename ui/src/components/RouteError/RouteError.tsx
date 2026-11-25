import Image from 'next/image';
import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import type { Journey } from '@/lib/station/useJourney';

interface RouteErrorProps {
  journey: Journey;
  /** '출발 위치 다시 확인' 뒤에 돌아올 화면 */
  returnPath: string;
}

/**
 * W11 · 경로 없음 · 오류 안내. 경로를 만들 수 없을 때 경로 화면들이 대신 보여준다.
 * 확인되지 않은 통로로 임의 안내하지 않는다.
 */
export default function RouteError({ journey, returnPath }: RouteErrorProps) {
  const { href } = journey;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <AppBar title="길안내 오류" backHref={href('/search')} />
      <ScreenBody className="items-center text-center">
        <h2 role="alert" className="mt-18 text-headline whitespace-pre-line text-ink">
          {'안내 가능한 경로를\n찾지 못했어요'}
        </h2>
        {/* Figma StatusBadge / Warning Triangle(80×72) */}
        <Image
          src="/illustrations/status-warning.svg"
          alt=""
          width={80}
          height={72}
          unoptimized
          className="mt-18"
        />
        <p className="mt-20 text-body-sm whitespace-pre-line text-ink-sub">
          {'출발 위치나 목적지를 바꿔 보세요.\n현장 표지판이나 안내 창구도 이용할 수 있어요.'}
        </p>
        <p className="mt-8 w-full rounded-lg bg-surface-sunken px-4 py-3 text-left text-caption text-ink-sub">
          확인되지 않은 통로로 임의 안내하지 않아요.
        </p>
        <Link href={href('/search')} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          목적지 다시 선택
        </Link>
        <Link
          href={href('/start', { next: href(returnPath, {}, ['to', 'platform']) })}
          className={cn(buttonClassNames('text', true), 'mt-2')}
        >
          출발 위치 다시 확인
        </Link>
      </ScreenBody>
    </div>
  );
}
