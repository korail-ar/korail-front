// Storybook Foundations 페이지에 보여줄 토큰 목록. 값의 원본은 src/styles/tokens.css이고,
// 견본 색은 CSS 변수로 칠하므로 여기 적힌 hex와 다르면 화면에서 바로 드러난다.

export interface PrimitiveScale {
  id: string;
  title: string;
  steps: { step: string; hex: string }[];
}

export const PRIMITIVE_SCALES: PrimitiveScale[] = [
  {
    id: 'blue',
    title: 'Blue (Primary #5673F9)',
    steps: [
      { step: '50', hex: '#F2F7FF' },
      { step: '100', hex: '#E3EBFF' },
      { step: '200', hex: '#C9D6FF' },
      { step: '300', hex: '#A5B6FD' },
      { step: '400', hex: '#7D93FB' },
      { step: '500', hex: '#5673F9' },
      { step: '600', hex: '#3F5CE6' },
      { step: '700', hex: '#2F47C2' },
      { step: '800', hex: '#253996' },
      { step: '900', hex: '#1B2A6B' },
    ],
  },
  {
    id: 'mint',
    title: 'Mint (최대 700까지만 사용)',
    steps: [
      { step: '50', hex: '#E2F6F2' },
      { step: '100', hex: '#C9EFE8' },
      { step: '200', hex: '#9FE3D6' },
      { step: '300', hex: '#6FD3C1' },
      { step: '400', hex: '#3FC0AA' },
      { step: '500', hex: '#1FA892' },
    ],
  },
  {
    id: 'red',
    title: 'Red (오류 전용)',
    steps: [
      { step: '50', hex: '#FFF1F1' },
      { step: '100', hex: '#FFDCDC' },
      { step: '200', hex: '#FFB8B8' },
      { step: '300', hex: '#FF8585' },
      { step: '400', hex: '#FF4D4D' },
      { step: '500', hex: '#FF1717' },
      { step: '600', hex: '#DC0F0F' },
    ],
  },
  {
    id: 'gray',
    title: 'Gray',
    steps: [
      { step: '50', hex: '#FCFDFF' },
      { step: '100', hex: '#F3F4F7' },
      { step: '200', hex: '#E4E7EC' },
      { step: '300', hex: '#C0C5CD' },
      { step: '400', hex: '#8C919A' },
      { step: '500', hex: '#6B7079' },
      { step: '600', hex: '#56595F' },
      { step: '700', hex: '#454545' },
      { step: '800', hex: '#2B2B2B' },
      { step: '900', hex: '#171717' },
    ],
  },
];

export const SEMANTIC_COLORS = [
  'bg',
  'surface',
  'surface-sunken',
  'ink',
  'ink-sub',
  'ink-mute',
  'ink-disabled',
  'on-color',
  'line',
  'line-strong',
  'brand',
  'brand-hover',
  'brand-press',
  'brand-soft',
  'brand-tint',
  'focus',
  'disabled-bg',
  'disabled-ink',
  'route',
  'route-transfer',
  'dest',
  'start',
  'start-ink',
  'start-soft',
  'success',
  'success-bg',
  'info',
  'info-bg',
  'warn-bg',
  'warn-fill',
  'warn-ink',
  'warn-icon',
  'danger',
  'danger-bg',
  'map-ground',
  'map-floor',
  'map-room',
  'map-wall',
  'map-zone',
  'map-zone-line',
  'marker',
  'marker-line',
] as const;

export interface TypeToken {
  name: string;
  spec: string;
  className: string;
  sample: string;
}

export const TYPE_SCALE: TypeToken[] = [
  { name: 'display', spec: '28/36 · w700', className: 'text-display', sample: '타는 곳 5번' },
  { name: 'title', spec: '22/30 · w700', className: 'text-title', sample: '약 2분 · 120m' },
  { name: 'heading', spec: '18/26 · w700', className: 'text-heading', sample: '매표·안내 창구' },
  {
    name: 'body-lg',
    spec: '17/26 · w700',
    className: 'text-body-lg',
    sample: '앞 통로에서 오른쪽으로 가세요',
  },
  { name: 'button', spec: '16/24 · w700', className: 'text-button', sample: '여기로 안내' },
  { name: 'body', spec: '15/22 · w400', className: 'text-body', sample: '매장 B를 지나 약 30m' },
  { name: 'label', spec: '14/20 · w700', className: 'text-label', sample: '화장실' },
  { name: 'caption', spec: '13/18 · w400', className: 'text-caption', sample: '3층 · 동쪽 통로' },
  { name: 'map-label', spec: '12/16 · w700', className: 'text-map-label', sample: '보관함' },
];

export const SPACING = [
  { name: 'space-1', px: 4, className: 'w-1' },
  { name: 'space-2', px: 8, className: 'w-2' },
  { name: 'space-3', px: 12, className: 'w-3' },
  { name: 'space-4', px: 16, className: 'w-4' },
  { name: 'space-5', px: 20, className: 'w-5' },
  { name: 'space-6', px: 24, className: 'w-6' },
  { name: 'space-8', px: 32, className: 'w-8' },
];

export const RADII = [
  { name: 'radius-xs', px: '6px', className: 'rounded-xs' },
  { name: 'radius-sm', px: '8px', className: 'rounded-sm' },
  { name: 'radius-md', px: '12px', className: 'rounded-md' },
  { name: 'radius-lg', px: '16px', className: 'rounded-lg' },
  { name: 'radius-xl', px: '24px', className: 'rounded-xl' },
  { name: 'radius-full', px: '999px', className: 'rounded-full' },
];

export const SHADOWS = [
  { name: 'shadow-float', spec: '0 2px 8px · 18%', className: 'shadow-float' },
  { name: 'shadow-sheet', spec: '0 -4px 20px · 12%', className: 'shadow-sheet' },
];

export const SIZES = [
  { name: 'tap-min · 48px', description: '누를 수 있는 모든 요소의 최소 크기' },
  { name: 'icon-sm · 16px', description: '시설 마커·태그 안 아이콘' },
  { name: 'icon-md · 20px', description: '버튼·목록 안 아이콘' },
  { name: 'icon-lg · 24px', description: '아이콘 버튼, 방향 아이콘' },
  { name: 'marker-facility · 28px', description: '기본 시설 마커 지름' },
  { name: 'marker-selected · 40px', description: '선택된 마커 지름' },
  { name: 'route-width · 6px', description: '경로선 굵기(흰 테두리 12px)' },
];
