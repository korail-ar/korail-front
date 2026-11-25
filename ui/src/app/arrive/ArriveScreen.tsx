'use client';

import Image from 'next/image';
import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import FacilityCard from '@/components/FacilityCard/FacilityCard';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import { CATEGORY_INFO, JOURNEY_KEYS, ROUTE_FLOOR_LABEL } from '@/lib/station/data';
import { pickJosa } from '@/lib/station/josa';
import useJourney from '@/lib/station/useJourney';

/** W10 · 도착 완료 */
export default function ArriveScreen() {
  const journey = useJourney();
  const { destination, destinationLabel, route, steps, status, href } = journey;

  if (status !== 'ok' || !destination || !route) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  const category = CATEGORY_INFO[destination.category];

  return (
    <>
      <AppBar
        title="안내 완료"
        backHref={href('/guide', { step: Math.max(steps.length - 1, 0) }, JOURNEY_KEYS)}
      />
      <ScreenBody>
        <section aria-label="도착 확인" className="mt-6.5 flex flex-col items-center text-center">
          <p role="status" className="text-headline text-ink">
            {`${destinationLabel}에 도착했어요`}
          </p>
          <p className="mt-0.5 text-body text-ink-sub">
            {`현장 표지판에서 ‘${destinationLabel}’${pickJosa(destinationLabel, '을')} 확인해 주세요.`}
          </p>
          <Image
            src="/illustrations/arrival.svg"
            alt=""
            width={280}
            height={220}
            unoptimized
            loading="eager"
            className="mt-3"
          />
        </section>

        <FacilityCard
          icon={category.icon}
          name={destination.name}
          floor={ROUTE_FLOOR_LABEL}
          rows={[
            { id: 'category', icon: category.icon, text: category.description ?? category.label },
            { id: 'notice', icon: 'info', text: '운영 정보는 현장에서 확인해 주세요' },
          ]}
          needsCheck={destination.isApproximate}
          showAction={false}
          className="mt-4"
        />
        <p className="mt-4 text-caption whitespace-pre-line text-ink-sub">
          {'QR 출발점 기준의 단계 안내예요.\n실제 도착 여부는 현장 표지판으로 확인해 주세요.'}
        </p>
        <Link href={href('/search')} className={cn(buttonClassNames('primary', true), 'mt-4')}>
          다른 목적지 찾기
        </Link>
        <Link href={href('/')} className={cn(buttonClassNames('text', true), 'mt-1.5')}>
          홈으로 돌아가기
        </Link>
      </ScreenBody>
    </>
  );
}
