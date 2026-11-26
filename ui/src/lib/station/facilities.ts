import facilityData from '@/data/navigation/facilities.generated.json';

import { findNavigationRoute, type NavigationRoute, type RoutingOptions } from './navigation';
import type { MapPoint } from './types';
import type { VerificationStatus } from './spatial';

export interface FacilityEntrance {
  id: string;
  position: MapPoint | null;
  connectedNodeId: string;
  accessible: boolean | null;
  verificationStatus: VerificationStatus;
  kind: 'APPROACH_POINT_NOT_VERIFIED_ENTRANCE' | 'VERIFIED_ENTRANCE';
}

export interface Facility {
  id: number;
  name: string;
  floor: string;
  displayPosition: MapPoint | null;
  entrances: FacilityEntrance[];
}

const facilities = facilityData.facilities as unknown as Facility[];
const byId = new Map(facilities.map((facility) => [facility.id, facility]));

export function findFacility(id: number): Facility | undefined {
  return byId.get(id);
}

export function allFacilities(): readonly Facility[] {
  return facilities;
}

/** A display marker is never substituted for an entrance/access point. */
export function routeToFacility(startNodeId: string, facilityId: number,
  options: RoutingOptions = {}): NavigationRoute | null {
  const facility = findFacility(facilityId);
  if (!facility) return null;
  const candidates = facility.entrances.filter((entrance) => entrance.connectedNodeId
    && (options.mode !== 'ACCESSIBLE' || entrance.accessible === true))
    .map((entrance) => ({ entrance,
      route: findNavigationRoute(startNodeId,
        `${facility.floor}:${entrance.connectedNodeId}`, options) }))
    .filter((candidate): candidate is { entrance: FacilityEntrance; route: NavigationRoute } =>
      candidate.route !== null && candidate.route.validation.isValid)
    .sort((a, b) => a.route.metrics.distanceMeters - b.route.metrics.distanceMeters);
  if (!candidates.length) return null;
  const { entrance, route } = candidates[0];
  const warning = entrance.kind === 'VERIFIED_ENTRANCE' ? []
    : [`${facility.name}: 실제 출입구 위치 미확인, 접근 가능한 통로까지만 안내`];
  return {
    ...route,
    destinationId: `${facility.floor}:facility:${facility.id}`,
    verificationStatus: warning.length ? 'UNVERIFIED' : route.verificationStatus,
    validation: { ...route.validation,
      warnings: [...route.validation.warnings, ...warning] },
  };
}
