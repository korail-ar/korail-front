import { JOURNEY_KEYS } from '@/lib/station/data';
import type { Journey } from '@/lib/station/useJourney';

/** "다음 단계" 버튼의 글자와 갈 곳. 마지막 단계(도착·층 이동)에서는 도착 화면으로 간다. */
export default function getNextStep(
  { steps, stepIndex, destinationLabel, href }: Journey,
  path: '/guide' | '/guide/steps',
) {
  const isLast = stepIndex >= steps.length - 1;
  if (isLast) {
    return { label: `${destinationLabel} 도착 확인`, href: href('/arrive', {}, JOURNEY_KEYS) };
  }
  return { label: '다음 단계', href: href(path, { step: stepIndex + 1 }, JOURNEY_KEYS) };
}
