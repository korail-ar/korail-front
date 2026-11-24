import { STATION } from './data';
import withJosa from './josa';
import { roundMeters, toMeters } from './route';
import type { GuideStep, MapPoint, Route, StationPlace } from './types';

// 이 각도보다 크게 꺾이면 새 단계로 나눈다.
const TURN_THRESHOLD_DEG = 35;
// 이보다 짧은 구간은 단계로 나누지 않는다(짧은 꺾임은 앞 단계에 합친다).
const MIN_LEG_METERS = 8;
// 단계 안내에 쓸 눈에 보이는 시설(랜드마크)을 찾는 거리.
const LANDMARK_RADIUS_METERS = 18;

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function pathLength(points: readonly MapPoint[]): number {
  return points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0);
}

/** 화면 좌표(y가 아래로 커짐)에서 두 진행 방향 사이 각도. 양수면 오른쪽으로 꺾는다. */
function turnAngle(a: MapPoint, b: MapPoint, c: MapPoint): number {
  const heading1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const heading2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
  let delta = ((heading2 - heading1) * 180) / Math.PI;
  if (delta > 180) {
    delta -= 360;
  }
  if (delta < -180) {
    delta += 360;
  }
  return delta;
}

interface Leg {
  points: MapPoint[];
  /** 이 구간을 시작할 때 꺾는 방향(첫 구간은 null) */
  turn: 'left' | 'right' | null;
}

export function splitLegs(points: readonly MapPoint[]): Leg[] {
  const minLegUnits = MIN_LEG_METERS / STATION.metersPerUnit;
  const legs: Leg[] = [];
  let current: Leg = { points: [points[0]], turn: null };

  for (let i = 1; i < points.length; i += 1) {
    current.points.push(points[i]);
    const isLast = i === points.length - 1;
    if (!isLast) {
      const angle = turnAngle(points[i - 1], points[i], points[i + 1]);
      if (Math.abs(angle) >= TURN_THRESHOLD_DEG && pathLength(current.points) >= minLegUnits) {
        legs.push(current);
        current = { points: [points[i]], turn: angle > 0 ? 'right' : 'left' };
      }
    }
  }
  legs.push(current);

  // 마지막 구간이 너무 짧으면 앞 구간에 붙인다(도착 직전의 작은 꺾임).
  const last = legs[legs.length - 1];
  if (legs.length > 1 && pathLength(last.points) < minLegUnits) {
    legs.pop();
    legs[legs.length - 1].points.push(...last.points.slice(1));
  }
  return legs;
}

/** 지도에 이름이 보이는 시설 중 point에서 가장 가까운 것. */
function findLandmark(point: MapPoint, excludeId?: number): StationPlace | undefined {
  const radius = LANDMARK_RADIUS_METERS / STATION.metersPerUnit;
  let best: StationPlace | undefined;
  let bestDistance = radius;
  STATION.places.forEach((place) => {
    if (!place.onMap || place.x === null || place.y === null || place.id === excludeId) {
      return;
    }
    const d = distance(point, [place.x, place.y]);
    if (d < bestDistance) {
      best = place;
      bestDistance = d;
    }
  });
  return best;
}

const DIRECTION_LABELS = { left: '왼쪽', right: '오른쪽' } as const;

interface BuildStepsOptions {
  startName: string;
  destination: StationPlace;
  /** 타는 곳 번호. 있으면 마지막 단계가 승강장으로 내려가는 층 이동이 된다. */
  platformNumber?: number;
}

/**
 * 경로를 사용자가 "다음 단계"로 넘기는 안내 단계로 나눈다.
 * 방향은 지도 기준이며(나침반을 쓰지 않음), 각 단계에 눈에 보이는 시설을 함께 적는다.
 */
export function buildSteps(
  route: Route,
  { startName, destination, platformNumber }: BuildStepsOptions,
): GuideStep[] {
  const legs = splitLegs(route.points);
  const walkSteps = legs.map((leg, index): GuideStep => {
    const meters = roundMeters(toMeters(pathLength(leg.points)));
    const end = leg.points[leg.points.length - 1];
    const isLastLeg = index === legs.length - 1;
    const endLandmark = isLastLeg ? destination : findLandmark(end, destination.id);
    const towards = endLandmark ? `${endLandmark.name} 방향` : '';

    if (leg.turn === null) {
      const target = endLandmark?.name ?? '앞';
      return {
        kind: 'walk',
        icon: 'arrow-up',
        text: `${withJosa(target, '으로')} 직진`,
        sub: `약 ${meters}m`,
        detail: `${startName}에서 ${withJosa(target, '으로')} 약 ${meters}m 걸어가세요.`,
        points: leg.points,
      };
    }

    const direction = DIRECTION_LABELS[leg.turn];
    const turnLandmark = findLandmark(leg.points[0], destination.id);
    const where = turnLandmark ? `${turnLandmark.name} 앞에서 ` : '';
    return {
      kind: 'walk',
      icon: leg.turn === 'left' ? 'turn-left' : 'turn-right',
      text: `${where}${direction}으로`,
      sub: [`약 ${meters}m`, towards].filter(Boolean).join(' · '),
      detail: `${where || '갈림길에서 '}${direction}으로 돌아 약 ${meters}m 걸어가세요.`,
      points: leg.points,
    };
  });

  const destinationPoint = route.points[route.points.length - 1];
  if (platformNumber !== undefined) {
    return [
      ...walkSteps,
      {
        kind: 'floor',
        icon: 'stairs',
        text: `${platformNumber}번 승강장으로 내려가기`,
        sub: '계단·에스컬레이터 또는 승강기',
        detail: `${destination.name}에서 ${platformNumber}번 승강장으로 내려가세요.`,
        points: [destinationPoint],
      },
    ];
  }

  return [
    ...walkSteps,
    {
      kind: 'arrive',
      icon: 'pin',
      text: `${destination.name}에 도착`,
      sub: '표지판을 확인해 주세요',
      detail: `${withJosa(destination.name, '이')} 보이면 안내를 마칩니다.`,
      points: [destinationPoint],
    },
  ];
}
