import type { IconName } from '@/components/Icon/Icon';
import type { NavigationRoute } from './navigation';

export type MapPoint = readonly [x: number, y: number];

export type PlaceCategory =
  | 'shop'
  | 'elevator'
  | 'restroom'
  | 'facility'
  | 'platform_access'
  | 'vertical_transport'
  | 'entrance'
  | 'ticketing'
  | 'parking';

export interface StationNode {
  id: string;
  name: string;
  type: 'corridor' | 'approach';
  x: number;
  y: number;
}

export interface StationEdge {
  id: string;
  source: string;
  target: string;
  /** 지도 단위 길이. m로 바꿀 때는 metersPerUnit을 곱한다. */
  length: number;
}

export interface StationPlace {
  id: number;
  /** 화면에 보여줄 이름(설명형 원본 이름은 지도 마커 이름으로 바꿨다) */
  name: string;
  sourceName: string;
  category: PlaceCategory;
  aliases: string[];
  nameStatus: 'labeled' | 'descriptive';
  /** 디자인팀 지도에 같은 시설 마커가 있는지 */
  onMap: boolean;
  x: number | null;
  y: number | null;
  /** 경로가 끝나는 노드. 위치를 모르는 시설은 null(검색만 가능) */
  routeNodeId: string | null;
  /** 시설 접근 노드가 없어 가장 가까운 지점까지만 안내하는지 */
  isApproximate: boolean;
}

export interface StationData {
  floor: number;
  viewBox: [number, number, number, number];
  metersPerUnit: number;
  nodes: StationNode[];
  edges: StationEdge[];
  places: StationPlace[];
}

export interface CategoryInfo {
  label: string;
  icon: IconName;
  /** 도착 화면(W10) 시설 카드의 첫 줄 */
  description?: string;
}

export interface StartPoint {
  id: string;
  name: string;
  nodeId: string;
}

export interface Route {
  nodeIds: string[];
  points: MapPoint[];
  meters: number;
  minutes: number;
  navigation?: NavigationRoute;
}

export type StepKind = 'walk' | 'floor' | 'arrive';

export interface GuideStep {
  kind: StepKind;
  icon: IconName;
  /** StepBar·StepItem 한 줄 */
  text: string;
  /** 눈에 보이는 표지 · 거리 */
  sub: string;
  /** 본문 설명(W07) */
  detail: string;
  /** 이 단계에서 걷는 구간(지도 위 강조용) */
  points: MapPoint[];
  /** 이 단계에서 보이는 시설(여정 표시의 경유 지점 후보). 목적지는 넣지 않는다. */
  landmark?: string;
}
