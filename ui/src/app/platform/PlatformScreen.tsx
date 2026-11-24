'use client';

import Link from 'next/link';
import { useState } from 'react';

import AppBar from '@/components/AppBar/AppBar';
import Button, { buttonClassNames } from '@/components/Button/Button';
import NumberBadge from '@/components/NumberBadge/NumberBadge';
import cn from '@/lib/cn';
import { PLATFORMS, findPlatform } from '@/lib/station/data';
import useJourney from '@/lib/station/useJourney';

export default function PlatformScreen() {
  const { params, href } = useJourney();
  const [selected, setSelected] = useState(findPlatform(params.get('platform'))?.number ?? null);
  const platform = PLATFORMS.find((item) => item.number === selected);
  const outOfService = PLATFORMS.filter((item) => !item.isInService).map((item) => item.number);

  return (
    <>
      <AppBar title="승강장 번호 선택" backHref={href('/')} />
      <div className="flex flex-col px-5 pb-8">
        <h2 className="mt-3 text-screen-title text-ink">몇 번 승강장으로 가세요?</h2>
        <p className="mt-2 text-body-sm whitespace-pre-line text-ink-sub">
          {'전광판·코레일톡에서 확인한 번호를\n그대로 선택하세요. 호차 번호와는 달라요.'}
        </p>

        <div role="group" aria-label="타는 곳 번호" className="mt-5 grid grid-cols-4 gap-3">
          {PLATFORMS.map((item) => (
            <Button
              key={item.number}
              variant={item.number === selected ? 'primary' : 'secondary'}
              aria-pressed={item.number === selected}
              aria-label={item.isInService ? `${item.number}번` : `${item.number}번 (미운행)`}
              disabled={!item.isInService}
              onClick={() => setSelected(item.number)}
              className="px-0"
            >
              {item.number}
            </Button>
          ))}
        </div>
        {outOfService.length > 0 && (
          <p className="mt-2 text-note text-ink-mute">
            {`${outOfService.join('·')}번은 지도에 미운행으로 표시되어 있어 고를 수 없어요.`}
          </p>
        )}

        <section
          aria-label="선택한 승강장"
          aria-live="polite"
          className="mt-5 flex flex-col gap-4 rounded-lg border border-line bg-surface p-4"
        >
          {platform ? (
            <div className="flex items-center gap-6">
              <NumberBadge kind="platform" number={platform.number} />
              <p className="text-subtitle text-ink">{`${platform.number}번 승강장`}</p>
            </div>
          ) : (
            <p className="text-body-lg text-ink-mute">번호를 선택해 주세요</p>
          )}
          <p className="text-note text-ink-sub">선택한 번호를 다시 확인해 주세요.</p>
        </section>

        {platform ? (
          <Link
            href={href('/route', { to: platform.placeId, platform: platform.number })}
            className={cn(buttonClassNames('primary', true), 'mt-6')}
          >
            선택한 승강장으로 경로 확인
          </Link>
        ) : (
          <Button fullWidth disabled className="mt-6">
            선택한 승강장으로 경로 확인
          </Button>
        )}
      </div>
    </>
  );
}
