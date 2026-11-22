export type RoutePoint = readonly [x: number, y: number];

interface RouteLineProps {
  points: readonly RoutePoint[];
  /** 층이 바뀌는 구간. 점선으로 그린다. */
  transfer?: boolean;
}

const CASING_WIDTH = 12;
const ROUTE_WIDTH = 6;
// Figma RouteLine/Transfer의 점 간격(약 12px)에 맞춘 값. 둥근 끝(round cap)이 점 모양을 만든다.
const TRANSFER_DASH = '1 11';

function toPathData(points: readonly RoutePoint[]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

/**
 * 경로선. 흰 테두리 12px 위에 route 6px, 끝·꺾임은 둥글게.
 * 지도 <svg> 안에 넣는 <g>를 돌려준다. 지나온 길 색 바꾸기·흐르는 애니메이션은 쓰지 않는다.
 */
export default function RouteLine({ points, transfer = false }: RouteLineProps) {
  const pathData = toPathData(points);

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={pathData} className="stroke-on-color" strokeWidth={CASING_WIDTH} />
      <path
        d={pathData}
        className="stroke-route"
        strokeWidth={ROUTE_WIDTH}
        strokeDasharray={transfer ? TRANSFER_DASH : undefined}
      />
    </g>
  );
}
