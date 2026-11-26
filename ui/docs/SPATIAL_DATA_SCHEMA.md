# 공간 데이터와 좌표 스키마

`src/data/navigation/spatial.generated.json`은 층별 SVG ViewBox 좌표의 Polygon을 담는다. `coordinateSystem: SVG_VIEWBOX`는 CSS 확대·축소 및 화면 픽셀과 독립적이다. 거리 계산에는 층별 `metersPerUnit`을 적용한다. 현재 모든 층의 0.1049m/단위는 현장 실측 전 `ESTIMATED`다.

| 필드 | 의미 |
| --- | --- |
| `floor`, `viewBox` | SVG 층 ID와 원본 좌표 범위 |
| `areas[].type` | `WALKABLE_AREA`, `FACILITY`, `VERTICAL_CONNECTOR`, `RESTRICTED_AREA`, `UNKNOWN_AREA` 등 |
| `areas[].polygon` | SVG의 `map-floor`, `room-*`, `zone-*`에서 읽은 점 배열 |
| `verificationStatus` | `VERIFIED`, `ESTIMATED`, `UNVERIFIED`; 현재 SVG 파생 도형은 `ESTIMATED` |
| `source` | 해당 도형의 원본 `web-xF-map.svg` |

`map-floor`는 건물 바닥 윤곽으로 사용한다. 이는 실제 모든 지점의 보행 가능성을 보증하지 않는다. 매장·서비스 시설·화장실·층간 설비·승강장 제한 도형은 자유 보행 직선 후보에서 제외한다. 아이콘과 텍스트는 장애물로 처리하지 않는다. 바닥 윤곽 밖과 야외·주차·옥상 구역은 `UNKNOWN_AREA` 또는 `UNVERIFIED`로 남긴다.

`graph.generated.json`은 원본 `daejeon_routes_calculated.json`과 분리된 마이그레이션 결과다. 원본 노드·시설 ID와 URL 파라미터를 유지한다. 새 `J3W1145` 교차점과 `E028A/E028B/E054B` 분할 이력은 `migration`에 기록한다. Edge `geometrySvg`는 실제 선 형상이고 `distanceM`은 그 선분들의 유클리드 길이에 층별 축척을 곱한 값이다.

`facilities.generated.json`은 59개 시설의 **지도 표시 좌표**와 **경로 접근 노드**를 분리한다. 현재 자료에는 실제 출입구 좌표와 배리어프리 출입 가능 여부가 없으므로 `position: null`, `accessible: null`, `APPROACH_POINT_NOT_VERIFIED_ENTRANCE`로 기록한다. 확인되지 않은 시설 입구를 표시 중심으로 대신하지 않는다.

`local-links.generated.json`은 Shapely가 원본 공간 도형에 대해 전체 선분과 3 SVG 단위 안전 여유를 확인한 자유 보행 후보를 담는다. 현재 1F 44, 2F 49, 3F 1,010, 4F 132개다. 이 연결도 SVG 도면 근거의 `ESTIMATED`이며 현장 통행 검증은 별개다.
