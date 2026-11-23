import { routeProjection } from '../gps-navigation.js';

export class NavigationState {
  reset() { this.previousProgress = null; this.offStreak = 0; this.reverseStreak = 0; this.status = '경로 선택 대기'; }
  constructor() { this.reset(); }
  update({ routePoints, routeEdgeIds, match, heading, uncertaintyPx }) {
    if (!routePoints?.length || !match) { this.status = '현재 위치를 다시 지정해 주세요'; return { status: this.status, progress: null, reroute: false }; }
    const projection = routeProjection(routePoints, match);
    const onRoute = routeEdgeIds.includes(match.edge.id);
    this.offStreak = !onRoute && projection.distance > Math.max(8, uncertaintyPx) ? this.offStreak + 1 : 0;
    const delta = this.previousProgress === null ? 0 : projection.progress - this.previousProgress;
    this.reverseStreak = delta < -Math.max(3, uncertaintyPx * 0.5) && Number.isFinite(heading) ? this.reverseStreak + 1 : 0;
    this.previousProgress = projection.progress;
    this.status = this.offStreak >= 3 ? '새로운 경로 탐색 필요' : this.offStreak ? '다른 경로로 이동 중일 수 있습니다' : this.reverseStreak >= 2 ? '목적지와 반대 방향으로 이동하는 것 같습니다' : '정상 경로로 이동 중';
    return { status: this.status, progress: projection.progress / Math.max(1, projection.total), reroute: this.offStreak >= 3 };
  }
}
