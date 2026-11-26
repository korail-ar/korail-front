/* eslint-disable no-continue, @typescript-eslint/prefer-destructuring */
import { turnAngleDegrees } from './geometry';
import { metersPerUnit, polylineLength, type VerificationStatus } from './spatial';
import type { FloorRouteSegment, RouteSegment } from './navigation';
import type { MapPoint } from './types';

export type ManeuverType =
  | 'START' | 'CONTINUE' | 'SLIGHT_LEFT' | 'SLIGHT_RIGHT'
  | 'TURN_LEFT' | 'TURN_RIGHT' | 'U_TURN'
  | 'ENTER_STAIRS' | 'ENTER_ESCALATOR' | 'ENTER_ELEVATOR'
  | 'EXIT_VERTICAL_CONNECTOR' | 'ARRIVE';

export interface InstructionStep {
  id: string;
  floor: string;
  type: ManeuverType;
  message: string;
  geometry: MapPoint[];
  distanceMeters: number | null;
  estimatedSeconds: number | null;
  landmarkId?: string;
  connectorId?: string;
  verificationStatus: VerificationStatus;
}

const TURN_THRESHOLD_DEGREES = 35;
const MIN_LEG_METERS = 8;

function turnType(angle: number): ManeuverType {
  if (Math.abs(angle) >= 150) return 'U_TURN';
  return angle > 0 ? 'TURN_RIGHT' : 'TURN_LEFT';
}

function maneuverMessage(type: ManeuverType): string {
  if (type === 'START') return '출발 지점에서 경로를 따라 이동하세요.';
  if (type === 'TURN_LEFT') return '통로에서 왼쪽으로 이동하세요.';
  if (type === 'TURN_RIGHT') return '통로에서 오른쪽으로 이동하세요.';
  if (type === 'U_TURN') return '진행 방향을 바꾸세요.';
  return '통로를 따라 이동하세요.';
}

function connectorType(kind: string): ManeuverType {
  if (kind === 'elevator') return 'ENTER_ELEVATOR';
  if (kind === 'escalator') return 'ENTER_ESCALATOR';
  return 'ENTER_STAIRS';
}

function connectorName(kind: string): string {
  if (kind === 'elevator') return '엘리베이터';
  if (kind === 'escalator') return '에스컬레이터';
  return '계단';
}

function floorManeuvers(segment: FloorRouteSegment, speedMetersPerSecond: number,
  startIndex: number): InstructionStep[] {
  const points = segment.points;
  if (points.length < 2) return [];
  const scale = metersPerUnit(segment.floor);
  const legs: { points: MapPoint[]; type: ManeuverType }[] = [];
  let current: { points: MapPoint[]; type: ManeuverType } = {
    points: [points[0]], type: startIndex === 0 ? 'START' : 'CONTINUE',
  };
  for (let index = 1; index < points.length; index += 1) {
    current.points.push(points[index]);
    if (index === points.length - 1) continue;
    const angle = turnAngleDegrees(points[index - 1], points[index], points[index + 1]);
    const meters = polylineLength(current.points) * (scale ?? 0);
    if (Math.abs(angle) >= TURN_THRESHOLD_DEGREES && meters >= MIN_LEG_METERS) {
      legs.push(current);
      current = { points: [points[index]], type: turnType(angle) };
    }
  }
  legs.push(current);
  const last = legs[legs.length - 1];
  if (legs.length > 1 && polylineLength(last.points) * (scale ?? 0) < MIN_LEG_METERS) {
    legs.pop();
    legs[legs.length - 1].points.push(...last.points.slice(1));
  }
  return legs.map((leg, index) => {
    const distanceMeters = scale === null ? null : polylineLength(leg.points) * scale;
    return {
      id: `${segment.floor}:walk:${startIndex + index}`,
      floor: segment.floor, type: leg.type,
      message: maneuverMessage(leg.type),
      geometry: leg.points, distanceMeters,
      estimatedSeconds: distanceMeters === null ? null : distanceMeters / speedMetersPerSecond,
      verificationStatus: segment.verificationStatus,
    };
  });
}

/** Instruction geometry concatenates to the final preview geometry per floor. */
export function buildNavigationInstructions(
  segments: readonly RouteSegment[], speedMetersPerSecond: number,
): InstructionStep[] {
  const instructions: InstructionStep[] = [];
  segments.forEach((segment) => {
    if (segment.kind === 'floor') {
      instructions.push(...floorManeuvers(segment, speedMetersPerSecond, instructions.length));
      return;
    }
    instructions.push({
      id: `${segment.id}:enter`, floor: segment.fromFloor,
      type: connectorType(segment.connectorType),
      message: `${connectorName(segment.connectorType)}를 이용하세요.`,
      geometry: [], distanceMeters: segment.distanceMeters,
      estimatedSeconds: segment.estimatedSeconds, connectorId: segment.id,
      verificationStatus: segment.verificationStatus,
    });
    instructions.push({
      id: `${segment.id}:exit`, floor: segment.toFloor, type: 'EXIT_VERTICAL_CONNECTOR',
      message: `${segment.toFloor}에 도착했습니다.`, geometry: [],
      distanceMeters: 0, estimatedSeconds: 0, connectorId: segment.id,
      verificationStatus: segment.verificationStatus,
    });
  });
  const last = segments[segments.length - 1];
  const floor = last?.kind === 'transfer' ? last.toFloor : last?.floor ?? '3F';
  const point = last?.kind === 'floor' ? last.points[last.points.length - 1] : undefined;
  instructions.push({
    id: `${floor}:arrive`, floor, type: 'ARRIVE',
    message: '목적지 표지판을 확인하세요.', geometry: point ? [point] : [],
    distanceMeters: 0, estimatedSeconds: 0,
    verificationStatus: last?.verificationStatus ?? 'UNVERIFIED',
  });
  return instructions;
}
