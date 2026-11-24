import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tokens.css의 글자 크기·그림자 토큰. tailwind-merge가 이 이름을 모르면 text-button을 글자 색으로 보고
// text-on-color와 충돌한다며 지워 버리므로 그룹을 알려 준다.
const TEXT_TOKENS = [
  'display',
  'title',
  'heading',
  'body-lg',
  'button',
  'body',
  'label',
  'caption',
  'map-label',
  'screen-title',
  'subtitle',
  'body-sm',
  'note',
];
const SHADOW_TOKENS = ['float', 'sheet'];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_TOKENS }],
      shadow: [{ shadow: SHADOW_TOKENS }],
    },
  },
});

// 조건부 클래스를 합치고, 충돌하는 Tailwind 유틸리티는 뒤에 온 것을 남긴다(CONVENTIONS.md 5절).
export default function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
