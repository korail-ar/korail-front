'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import RouteError from '@/components/RouteError/RouteError';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import StationMap from '@/components/StationMap/StationMap';
import StepBar from '@/components/StepBar/StepBar';
import Tag from '@/components/Tag/Tag';
import cn from '@/lib/cn';
import { ROUTE_MAP_CAPTION } from '@/lib/station/data';
import withJosa from '@/lib/station/josa';
import useGuideViewModel from '@/view-models/useGuideViewModel';

function StepNarration({ text }: { text: string }) {
  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const speech = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    let started = false;
    const speak = () => {
      if (started) return;
      started = true;
      const voices = speech
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith('ko'));
      utterance.voice =
        voices.find((voice) => /natural|neural|premium|enhanced/i.test(voice.name)) ??
        voices.find((voice) => !voice.localService) ??
        voices[0] ??
        null;
      speech.cancel();
      speech.speak(utterance);
    };
    if (speech.getVoices().length > 0) speak();
    else speech.addEventListener('voiceschanged', speak);
    const fallback = window.setTimeout(speak, 1200);
    return () => {
      window.clearTimeout(fallback);
      speech.removeEventListener('voiceschanged', speak);
      speech.cancel();
    };
  }, [text]);

  return null;
}

/** W09 · 층 이동이 필요할 때(승강장 경로의 마지막 단계) */
function FloorChangeView({ vm }: { vm: ReturnType<typeof useGuideViewModel> }) {
  const { destination, destinationLabel } = vm.journey;
  const connector = destination?.name ?? '승강장 연결통로';

  return (
    <>
      <AppBar title="층 이동이 필요해요" backHref={vm.floorBackHref} />
      <StationMap
        fill
        route={vm.mapLayers.route}
        start={vm.mapLayers.start}
        floorPoint={
          vm.mapLayers.destination && { point: vm.mapLayers.destination.point, label: connector }
        }
        focus={vm.focus ?? vm.mapLayers.route}
        caption={ROUTE_MAP_CAPTION}
      />
      <ScreenBody variant="panel">
        <Tag
          label={`${destinationLabel} 방향 · 3F → 승강장`}
          variant="info"
          className="mt-5 self-start bg-transparent"
        />
        <h2 className="mt-4 text-title text-ink">
          {`${withJosa(destinationLabel, '으로')} 내려가야 해요`}
        </h2>
        <p className="mt-3 text-body whitespace-pre-line text-ink-sub">
          {`${connector}의 계단·에스컬레이터나 승강기로\n승강장에 내려가 주세요.`}
        </p>
        <StepNarration
          text={`${connector}의 계단이나 에스컬레이터, 또는 승강기로 승강장에 내려가 주세요.`}
        />
        <p className="mt-4 rounded-md border border-line bg-surface px-3 py-3 text-note whitespace-pre-line text-ink-sub">
          {'타는 곳 표지판을 확인한 뒤 계속해 주세요.\n승강기 C: 재확인 필요 · 경로 제외'}
        </p>
        <Link href={vm.next.href} className={cn(buttonClassNames('primary', true), 'mt-6')}>
          이동 후 계속하기
        </Link>
      </ScreenBody>
    </>
  );
}

/** W07 · 지도 길안내 */
export default function GuideScreen() {
  const vm = useGuideViewModel();
  const { destinationLabel, stepIndex, steps } = vm.journey;

  if (!vm.canGuide || !vm.step) {
    return <RouteError journey={vm.journey} returnPath="/route" />;
  }

  const { step } = vm;
  if (step.kind === 'floor') {
    return <FloorChangeView vm={vm} />;
  }

  return (
    <>
      <AppBar
        title={`${destinationLabel}까지 · ${stepIndex + 1} / ${steps.length}`}
        backHref={vm.backHref}
      />
      <StationMap
        fill
        {...vm.mapLayers}
        stepPoint={vm.stepPoint}
        focus={vm.focus}
        focusInsets={{ top: 110, bottom: 48, left: 24, right: 24 }}
        showFloorControl={false}
        showZoomControl={false}
        recenterPlacement="none"
        overlay={
          <StepBar
            text={step.text}
            sub={step.sub}
            variant="floating"
            className="pointer-events-none absolute top-5 right-5 left-5 z-10 bg-blue-400/90"
          />
        }
      />
      <ScreenBody variant="panel" className="rounded-t-xl border-t border-line bg-surface pt-4">
        <p className="text-note text-ink-sub">
          {step.kind === 'arrive' ? '마지막 확인 지점' : '다음 확인 지점'}
        </p>
        <h2 className="mt-2 text-title text-ink">
          {step.landmark ?? (step.kind === 'arrive' ? destinationLabel : '안내된 통로 끝')}
        </h2>
        {step.kind === 'arrive' ? (
          <p className="mt-2 text-note text-ink-sub">
            현장 표지판에서 {destinationLabel}를 확인해 주세요.
          </p>
        ) : (
          <>
            <p className="mt-2 text-note text-ink-sub">{step.detail}</p>
            <p className="text-note text-ink-sub">해당 지점에 도착한 뒤 눌러주세요.</p>
            <p className="text-note text-ink-sub">다음 구간이 화면 위쪽으로 정렬돼요.</p>
          </>
        )}
        <StepNarration text={step.detail} />
        <Link href={vm.next.href} className={cn(buttonClassNames('primary', true), 'mt-4')}>
          {step.kind === 'arrive' ? '도착했어요' : vm.next.label}
        </Link>
        <Link href={vm.backHref} className={cn(buttonClassNames('text', true), 'mt-1')}>
          {stepIndex === 0 ? '시작 위치 다시 확인' : '이전 지점으로'}
        </Link>
      </ScreenBody>
    </>
  );
}
