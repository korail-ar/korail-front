'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import FacilityCard from '@/components/FacilityCard/FacilityCard';
import Icon from '@/components/Icon/Icon';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import cn from '@/lib/cn';
import { CATEGORY_INFO, JOURNEY_KEYS, ROUTE_FLOOR_LABEL } from '@/lib/station/data';
import { roundMeters } from '@/lib/station/route';
import useJourney from '@/lib/station/useJourney';

export default function ArriveScreen() {
  const router = useRouter();
  const journey = useJourney();
  const { destination, route, steps, start, platformNumber, status, href } = journey;

  if (status !== 'ok' || !destination || !route) {
    return <RouteError journey={journey} returnPath="/route" />;
  }

  const sign = platformNumber ? `${platformNumber}번 타는 곳` : destination.name;
  const category = CATEGORY_INFO[destination.category];

  return (
    <>
      <AppBar
        title="목적지에 도착했어요"
        backHref={href('/guide', { step: Math.max(steps.length - 1, 0) }, JOURNEY_KEYS)}
      />
      <ScreenBody>
        <section
          aria-label="도착 확인"
          className="mt-4 flex flex-col rounded-lg border border-line bg-surface px-4 pt-7 pb-6"
        >
          <Icon name="pin" size={24} className="text-ink" />
          <p role="status" className="mt-3 text-screen-title text-ink">
            도착했어요!
          </p>
          <p className="mt-2 text-caption text-ink-sub">{`${sign} 표지판을 확인해 주세요.`}</p>
        </section>

        <FacilityCard
          icon={category.icon}
          name={destination.name}
          floor={ROUTE_FLOOR_LABEL}
          rows={[
            { id: 'category', icon: 'pin', text: category.label },
            {
              id: 'distance',
              icon: 'walk',
              text: `${start.name}에서 약 ${route.minutes}분 · 약 ${roundMeters(route.meters)}m`,
            },
          ]}
          needsCheck={destination.isApproximate}
          actionLabel="다른 목적지 찾기"
          actionIcon={null}
          onAction={() => router.push(href('/search'))}
          className="mt-6"
        />
        <p className="mt-8 text-caption whitespace-pre-line text-ink-mute">
          {'시설 정보는 현장 확인 전 정보예요.\n정확한 운영 정보는 현장 안내를 확인해 주세요.'}
        </p>
        <Link href={href('/')} className={cn(buttonClassNames('secondary', true), 'mt-14')}>
          길찾기 종료
        </Link>
      </ScreenBody>
    </>
  );
}
