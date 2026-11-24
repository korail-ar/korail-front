/**
 * 3층 보행 그래프(merged)를 디자인팀 2D 지도(web-3F-map.svg) 좌표로 옮겨 앱에서 쓰는 JSON을 만든다.
 *
 * 실행: `npm run build:station` (ui/ 안에서)
 *
 * 왜 변환이 필요한가:
 *   원본 그래프의 x·y는 3D 렌더 이미지(daejeon_3d_F3.png, 2048×1386)의 픽셀 좌표라서 원근이 들어가 있고,
 *   디자인팀 2D 지도는 별도 좌표계(격자 1칸 = 190)다. 그래서
 *   1) 이름이 같은 시설(지도 마커 ↔ 그래프 place)을 기준점으로 잡아 원근 변환(homography)을 구하고,
 *   2) 남은 오차를 thin-plate spline으로 보정해 기준점이 지도 마커 위에 정확히 오게 한 뒤,
 *   3) 바닥 밖이나 방 안으로 떨어진 통로 노드는 가장 가까운 걷는 곳으로 옮기고,
 *   4) 시설 접근 노드는 해당 시설 마커 바로 옆 걷는 곳에 둔다(경로가 마커에서 끝나도록).
 *   거리(m)는 위경도가 있는 기준점끼리의 실거리와 지도 거리 비로 추정한다(현장 검증 전 추정값).
 *
 * 원본: coordinate/3f/result/daejeon-station-3f-graph.merged.json (2026-11-20, sha256 892b4b973b78…)
 *       → src/data/station/source/ 에 그대로 복사해 두었다.
 * 지도: Google Drive 「daejeon-station-map/web」 web-1F~4F-map.svg (2026-11-24, 디자인팀) → public/maps/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_PATH = path.join(ROOT, 'src/data/station/source/daejeon-station-3f-graph.merged.json');
const MAP_PATH = path.join(ROOT, 'public/maps/web-3F-map.svg');
const OUT_PATH = path.join(ROOT, 'src/data/station/station3f.generated.json');

/**
 * 기준점: 그래프 place id → 지도 마커 id(web-3F-map.svg의 g#3F-xxx).
 * 이름이 같거나 뜻이 같은 것만 넣었다. 예: 직영편의점 = 스토리웨이(코레일 직영 편의점 상호),
 * 엘리베이터(2번 출구·동광장) = 승강기 A(1·3층), 승강장 연결통로 1 = 지도의 '미운행' 홈.
 */
const CONTROL_POINTS = {
  1: ['3F-P12', '3F-P42'], // 동측 계단·에스컬레이터 → 두 마커의 가운데
  2: '3F-P40',
  3: '3F-P07',
  4: '3F-N04',
  5: '3F-W02',
  6: '3F-W03',
  7: '3F-E01',
  8: '3F-P01',
  9: '3F-N06',
  10: '3F-N23',
  12: '3F-P49',
  13: '3F-N08',
  14: '3F-N24',
  15: '3F-E02',
  16: '3F-P32',
  18: '3F-P02',
  20: '3F-N25',
  22: '3F-P20',
  25: '3F-N12',
  26: '3F-N10',
  27: '3F-E03',
  29: '3F-P03',
  30: '3F-N16',
  31: '3F-E04',
  32: '3F-P21',
  33: '3F-P50',
  34: '3F-P04',
  35: '3F-N14',
  37: '3F-N17',
  38: '3F-N28',
  40: '3F-P27',
  41: '3F-N29',
  42: '3F-E05',
  43: '3F-P16',
  44: '3F-P05',
  46: '3F-W19',
  47: '3F-P11',
  48: '3F-W18',
  51: '3F-I14',
  52: '3F-E06',
  53: '3F-P06',
};

/** 원본에 픽셀 좌표가 없지만 지도에 마커가 있는 시설: place id → 지도 마커 id. */
const MAP_ONLY_POSITIONS = {
  54: '3F-N11', // 와플샵
  55: '3F-N07', // 코브라독스
  56: '3F-N05', // 삼진어묵
  57: '3F-N27', // 에그박스
  58: '3F-P46', // 수유방 → 지도의 수유실
  59: '3F-I12', // 2층행 계단 → 지도의 계단(2·3층)
};

/** 직선거리로 고른 가장 가까운 노드가 벽 너머일 때만 직접 지정한다: place id → node id. */
const ROUTE_NODE_OVERRIDES = {
  48: 'P46', // 화장실(지도 하단): 직선거리로는 승강장 쪽 P50이 가깝지만 벽 너머라 옆 남자 화장실 접근점으로
};

// 걷는 곳 판정·이동 범위(지도 단위). 격자 1칸이 190이므로 벽에서 8 정도 떨어지면 경로선이 벽에 붙지 않는다.
const WALL_CLEARANCE = 8;
const SNAP_STEP = 4;
const SNAP_MAX_RADIUS = 240;

// ---------- 지도 읽기 ----------

function readMap(svg) {
  const markers = new Map();
  const markerNames = new Map();
  const markerPattern =
    /<g id="(3F-[A-Z]\d+)"[^>]*?data-name="([^"]*)"[^>]*?transform="translate\(([\d.]+) ([\d.]+)\)"/g;
  [...svg.matchAll(markerPattern)].forEach(([, id, name, x, y]) => {
    markers.set(id, [Number(x), Number(y)]);
    markerNames.set(id, name.replaceAll('&amp;', '&'));
  });

  const floorPath = svg.match(/<path id="3F-BLD_바닥"[^>]*\sd="([^"]+)"/)[1];
  const floor = [...floorPath.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(([, x, y]) => [
    Number(x),
    Number(y),
  ]);

  const rooms = [...svg.matchAll(/<rect id="3F-[^"]+" class="room-[^"]+"[^>]*>/g)].map(([tag]) => {
    const read = (name) => Number(tag.match(new RegExp(`\\s${name}="([\\d.]+)"`))[1]);
    return { x: read('x'), y: read('y'), width: read('width'), height: read('height') };
  });

  const viewBox = svg
    .match(/viewBox="([^"]+)"/)[1]
    .split(' ')
    .map(Number);
  return { markers, markerNames, floor, rooms, viewBox };
}

function isInsidePolygon([x, y], polygon) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      isInside = !isInside;
    }
  }
  return isInside;
}

function isInsideRoom([x, y], rooms) {
  return rooms.some(
    (room) => x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height,
  );
}

function createWalkableTest({ floor, rooms }) {
  const isOpen = (point) => isInsidePolygon(point, floor) && !isInsideRoom(point, rooms);
  const offsets = [
    [0, 0],
    [WALL_CLEARANCE, 0],
    [-WALL_CLEARANCE, 0],
    [0, WALL_CLEARANCE],
    [0, -WALL_CLEARANCE],
  ];
  return ([x, y]) => offsets.every(([dx, dy]) => isOpen([x + dx, y + dy]));
}

function snapToWalkable(point, isWalkable) {
  if (isWalkable(point)) {
    return point;
  }
  for (let radius = SNAP_STEP; radius <= SNAP_MAX_RADIUS; radius += SNAP_STEP) {
    let best = null;
    const steps = Math.ceil((2 * Math.PI * radius) / SNAP_STEP);
    for (let i = 0; i < steps; i += 1) {
      const angle = (2 * Math.PI * i) / steps;
      const candidate = [point[0] + radius * Math.cos(angle), point[1] + radius * Math.sin(angle)];
      if (isWalkable(candidate)) {
        best = candidate;
        break;
      }
    }
    if (best) {
      return best;
    }
  }
  throw new Error(`걷는 곳을 찾지 못함: ${point.join(', ')}`);
}

// ---------- 선형대수 ----------

function solveLinear(matrix, rhs) {
  const n = matrix.length;
  const a = matrix.map((row, i) => [...row, ...rhs[i]]);
  const width = a[0].length;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) {
        pivot = row;
      }
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let row = 0; row < n; row += 1) {
      if (row !== col) {
        const factor = a[row][col] / a[col][col];
        for (let k = col; k < width; k += 1) {
          a[row][k] -= factor * a[col][k];
        }
      }
    }
  }
  return a.map((row, i) => row.slice(n).map((value) => value / a[i][i]));
}

/** 원근 변환(h33 = 1)을 최소제곱으로 구한다. */
function fitHomography(source, target) {
  const rows = [];
  const values = [];
  source.forEach(([x, y], i) => {
    const [u, v] = target[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    values.push(u);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    values.push(v);
  });
  const normal = rows[0].map((_, i) =>
    rows[0].map((__, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
  );
  const rhs = rows[0].map((_, i) => [rows.reduce((s, r, k) => s + r[i] * values[k], 0)]);
  const h = solveLinear(normal, rhs).map(([value]) => value);
  return ([x, y]) => {
    const w = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
  };
}

function tpsKernel(a, b) {
  const r2 = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  return r2 === 0 ? 0 : r2 * Math.log(Math.sqrt(r2));
}

/** 기준점에서 남은 오차를 0으로 만드는 thin-plate spline 보정. */
function fitThinPlateSpline(points, offsets) {
  const n = points.length;
  const size = n + 3;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(0));
  const rhs = Array.from({ length: size }, () => [0, 0]);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      matrix[i][j] = tpsKernel(points[i], points[j]);
    }
    const affine = [1, points[i][0], points[i][1]];
    affine.forEach((value, k) => {
      matrix[i][n + k] = value;
      matrix[n + k][i] = value;
    });
    rhs[i] = offsets[i];
  }
  const weights = solveLinear(matrix, rhs);
  return (point) => {
    const offset = [0, 0];
    for (let i = 0; i < n; i += 1) {
      const k = tpsKernel(point, points[i]);
      offset[0] += k * weights[i][0];
      offset[1] += k * weights[i][1];
    }
    const affine = [1, point[0], point[1]];
    affine.forEach((value, k) => {
      offset[0] += value * weights[n + k][0];
      offset[1] += value * weights[n + k][1];
    });
    return [point[0] + offset[0], point[1] + offset[1]];
  };
}

// ---------- 거리 ----------

const EARTH_RADIUS_M = 6371000;

function haversine(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const round1 = (value) => Math.round(value * 10) / 10;

// ---------- 실행 ----------

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const map = readMap(fs.readFileSync(MAP_PATH, 'utf8'));
  const isWalkable = createWalkableTest(map);
  const placesById = new Map(source.places.map((place) => [place.id, place]));

  const markerPosition = (ref) => {
    const ids = Array.isArray(ref) ? ref : [ref];
    const points = ids.map((id) => {
      if (!map.markers.has(id)) {
        throw new Error(`지도에 마커가 없음: ${id}`);
      }
      return map.markers.get(id);
    });
    return [
      points.reduce((s, p) => s + p[0], 0) / points.length,
      points.reduce((s, p) => s + p[1], 0) / points.length,
    ];
  };

  const anchors = Object.entries(CONTROL_POINTS).map(([placeId, ref]) => {
    const place = placesById.get(Number(placeId));
    return { place, from: [place.x, place.y], to: markerPosition(ref) };
  });

  const homography = fitHomography(
    anchors.map((a) => a.from),
    anchors.map((a) => a.to),
  );
  const projected = anchors.map((a) => homography(a.from));
  const correct = fitThinPlateSpline(
    projected,
    anchors.map((a, i) => [a.to[0] - projected[i][0], a.to[1] - projected[i][1]]),
  );
  const project = (point) => correct(homography(point));

  // 시설: 기준점이면 마커 위치, 아니면 변환 위치. 위치를 모르는 시설은 검색에만 쓴다.
  const anchorByPlace = new Map(anchors.map((a) => [a.place.id, a.to]));
  Object.entries(MAP_ONLY_POSITIONS).forEach(([placeId, ref]) => {
    anchorByPlace.set(Number(placeId), markerPosition(ref));
  });
  const placePositions = source.places.map((place) => {
    const hasPosition = place.x !== null && place.y !== null;
    return anchorByPlace.get(place.id) ?? (hasPosition ? project([place.x, place.y]) : null);
  });

  const placeByNode = new Map(
    source.places.map((place, i) => [place.nodeId, placePositions[i]]).filter(([id]) => id),
  );
  const nodes = source.nodes.map((node) => {
    const placePosition = node.type === 'approach' ? placeByNode.get(node.id) : null;
    const [x, y] = snapToWalkable(placePosition ?? project([node.x, node.y]), isWalkable);
    return { id: node.id, name: node.name, type: node.type, x: round1(x), y: round1(y) };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  // 접근 노드가 없는 시설은 가장 가까운 노드까지 안내한다(isApproximate).
  const nearestNodeId = (position) =>
    nodes.reduce((best, node) =>
      distance([node.x, node.y], position) < distance([best.x, best.y], position) ? node : best,
    ).id;

  const places = source.places.map((place, i) => {
    const position = placePositions[i];
    let routeNodeId = place.nodeId ?? ROUTE_NODE_OVERRIDES[place.id] ?? null;
    if (!routeNodeId && position) {
      routeNodeId = nearestNodeId(position);
    }
    // 원본 이름이 설명형('지도 위에서 두 번째 …')이고 지도 마커와 짝지어졌으면 지도 이름을 쓴다.
    const markerRef = CONTROL_POINTS[place.id] ?? MAP_ONLY_POSITIONS[place.id];
    const markerName = typeof markerRef === 'string' ? map.markerNames.get(markerRef) : null;
    const name = place.nameStatus === 'descriptive' && markerName ? markerName : place.name;
    return {
      id: place.id,
      name,
      sourceName: place.name,
      category: place.category,
      aliases: place.aliases ?? [],
      nameStatus: place.nameStatus,
      onMap: anchorByPlace.has(place.id),
      x: position ? round1(position[0]) : null,
      y: position ? round1(position[1]) : null,
      routeNodeId,
      isApproximate: !place.nodeId,
    };
  });

  const edges = source.edges.map((edge) => {
    const a = nodeById.get(edge.source);
    const b = nodeById.get(edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      length: round1(distance([a.x, a.y], [b.x, b.y])),
    };
  });

  // 위경도가 있는 기준점 쌍으로 m/지도단위를 구한다(원점을 지나는 회귀).
  const geoAnchors = anchors.filter((a) => a.place.lat !== null && a.place.lng !== null);
  let sumMapSq = 0;
  let sumMapMeter = 0;
  for (let i = 0; i < geoAnchors.length; i += 1) {
    for (let j = i + 1; j < geoAnchors.length; j += 1) {
      const mapDistance = distance(geoAnchors[i].to, geoAnchors[j].to);
      const meters = haversine(geoAnchors[i].place, geoAnchors[j].place);
      sumMapSq += mapDistance ** 2;
      sumMapMeter += mapDistance * meters;
    }
  }
  const metersPerUnit = sumMapMeter / sumMapSq;

  const output = {
    generatedFrom: {
      graph: 'coordinate/3f/result/daejeon-station-3f-graph.merged.json (sha256 892b4b973b78…)',
      map: 'web-3F-map.svg (디자인팀, 2026-11-24)',
      note: '그래프 좌표를 지도 좌표로 옮긴 추정값입니다. 실제 문·개찰구 위치와 거리는 현장 확인이 필요합니다.',
    },
    floor: 3,
    viewBox: map.viewBox,
    metersPerUnit: Math.round(metersPerUnit * 10000) / 10000,
    nodes,
    edges,
    places,
  };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  const snapped = source.nodes.filter((node, i) => {
    const moved = distance(project([node.x, node.y]), [nodes[i].x, nodes[i].y]);
    return node.type === 'corridor' && moved > 1;
  });
  console.warn(
    `기준점 ${anchors.length}개, 노드 ${nodes.length}개(통로 ${snapped.length}개 이동), ` +
      `시설 ${places.length}개, m/단위 ${output.metersPerUnit} → ${path.relative(ROOT, OUT_PATH)}`,
  );
}

main();
