import rawStationData from '@/data/station/station3f.generated.json';

import type { CategoryInfo, PlaceCategory, StartPoint, StationData, StationPlace } from './types';

// scripts/build-station-data.mjs가 만든 3층 그래프(지도 좌표). JSON import는 넓은 타입으로 추론되므로 좁혀 쓴다.
export const STATION = rawStationData as unknown as StationData;

export const MAP_FLOORS = ['4F', '3F', '2F', '1F'] as const;
export type MapFloor = (typeof MAP_FLOORS)[number];
/**
 * 층별 2D 지도(public/maps/web-xF-map.svg)의 viewBox. 모든 층이 같은 좌표계(격자 1칸 = 190)라
 * 그대로 겹치면 층이 정렬된다(디자인팀 지도 설명).
 */
export const MAP_VIEWBOXES: Record<MapFloor, readonly [number, number, number, number]> = {
  '4F': [475, 308, 495, 822],
  '3F': [126, 125, 1800, 1752],
  '2F': [616, 1540, 586, 402],
  '1F': [288, 151, 1098, 1839],
};

export const FLOOR_LABELS: Record<MapFloor, string> = {
  '4F': '4층',
  '3F': '3층',
  '2F': '2층',
  '1F': '1층',
};

/** 경로 데이터가 있는 층. 다른 층은 지도만 보여준다. */
export const ROUTE_FLOOR: MapFloor = '3F';
export const ROUTE_FLOOR_LABEL = '3층';
/** 경로 지도 아래 설명. 경로·위치는 도면에서 추정한 값이라 늘 밝혀 둔다. */
export const ROUTE_MAP_CAPTION = '3층 · 확정 평면도 / 경로는 현장 확인 전 추정';
/** 화면 간 이동에서 경로 정보를 유지할 주소 항목 */
export const JOURNEY_KEYS = ['start', 'to', 'platform'] as const;

export const CATEGORY_INFO: Record<PlaceCategory, CategoryInfo> = {
  shop: { label: '매장', icon: 'shop', description: '역 안 매장' },
  elevator: { label: '엘리베이터', icon: 'elevator', description: '층을 오가는 승강기' },
  restroom: { label: '화장실', icon: 'toilet', description: '역 안 화장실' },
  facility: { label: '편의시설', icon: 'info', description: '이용객 편의시설' },
  platform_access: {
    label: '승강장 연결통로',
    icon: 'train',
    description: '타는 곳으로 내려가는 연결통로',
  },
  vertical_transport: {
    label: '계단·에스컬레이터',
    icon: 'stairs',
    description: '층을 오가는 계단·에스컬레이터',
  },
  entrance: { label: '출입구', icon: 'car', description: '역 출입구' },
  ticketing: { label: '승차권', icon: 'ticket', description: '승차권 구매·변경·환불 문의' },
  parking: { label: '주차장', icon: 'car', description: '역 주차장' },
};

export type QuickFilterId = 'transit' | 'exit' | 'restroom';

interface QuickFilter extends CategoryInfo {
  id: QuickFilterId;
  matches: (place: StationPlace) => boolean;
}

const TRANSIT_ALIASES = ['지하철', '도시철도'];

/**
 * 홈·검색 화면의 바로가기(Figma: 정류장 · 출구 · 화장실). 아이콘은 Figma 그대로 train · car · toilet.
 * 정류장은 연계교통 기능이 정해지면 유지하고, 빠지면 삭제할 예정(디자인팀 전달 사항).
 */
export const QUICK_FILTERS: readonly QuickFilter[] = [
  {
    id: 'transit',
    label: '정류장',
    icon: 'train',
    matches: (place) => place.aliases.some((alias) => TRANSIT_ALIASES.includes(alias)),
  },
  { id: 'exit', label: '출구', icon: 'car', matches: (place) => place.category === 'entrance' },
  {
    id: 'restroom',
    label: '화장실',
    icon: 'toilet',
    matches: (place) => place.category === 'restroom',
  },
];

export function isQuickFilterId(value: string | null): value is QuickFilterId {
  return QUICK_FILTERS.some((filter) => filter.id === value);
}

/**
 * QR 안내 시작 위치. QR 코드는 `/?start=<id>` 주소를 담는다.
 * 실제 QR 설치 자리가 정해지면 이 목록만 바꾸면 된다(지금은 예시 자리).
 */
export const START_POINTS: readonly StartPoint[] = [
  { id: 'concourse', name: '3층 맞이방', nodeId: 'C01' },
  { id: 'east-gate', name: '동광장 출입구 안쪽', nodeId: 'H01' },
  { id: 'west-gate', name: '서광장 출입구 안쪽', nodeId: 'H13' },
  { id: 'ticket-office', name: '매표소 앞', nodeId: 'H08' },
];

export const DEFAULT_START = START_POINTS[0];

export function findStartPoint(id: string | null): StartPoint {
  return START_POINTS.find((point) => point.id === id) ?? DEFAULT_START;
}

const PLACES_BY_ID = new Map(STATION.places.map((place) => [place.id, place]));
const NODES_BY_ID = new Map(STATION.nodes.map((node) => [node.id, node]));

export function findPlace(id: string | number | null): StationPlace | undefined {
  if (id === null || id === '') {
    return undefined;
  }
  return PLACES_BY_ID.get(Number(id));
}

export function findNode(id: string) {
  return NODES_BY_ID.get(id);
}

/**
 * 타는 곳 번호 → 승강장 연결통로(place id). 지도(web-3F-map) 기준으로 두 번호가 한 통로를 쓴다.
 * 1·2번은 디자인팀 지도에 '미운행'으로 표시되어 있어 고를 수 없게 둔다.
 */
export const PLATFORMS: readonly { number: number; placeId: number; isInService: boolean }[] = [
  { number: 1, placeId: 53, isInService: false },
  { number: 2, placeId: 53, isInService: false },
  { number: 3, placeId: 44, isInService: true },
  { number: 4, placeId: 44, isInService: true },
  { number: 5, placeId: 34, isInService: true },
  { number: 6, placeId: 34, isInService: true },
  { number: 7, placeId: 29, isInService: true },
  { number: 8, placeId: 29, isInService: true },
  { number: 9, placeId: 18, isInService: true },
  { number: 10, placeId: 18, isInService: true },
  { number: 11, placeId: 8, isInService: true },
  { number: 12, placeId: 8, isInService: true },
];

export function findPlatform(value: string | null) {
  return PLATFORMS.find((platform) => String(platform.number) === value && platform.isInService);
}
