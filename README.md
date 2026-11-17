# 대전역 3층 경로 안내 웹앱

출발지와 목적지를 검색해 대전역 3층 지도에 경로를 표시합니다. 브라우저의 GPS 좌표를 읽을 수 있지만, 지도 위 현재 위치 표시는 현장에서 측정한 기준점이 있어야 합니다.

## 실행

Node.js 22 이상에서 `npm install` 후 `npm run dev`를 실행합니다. `npm run build`로 배포 파일을 만듭니다. 첫 화면은 경로 지도이며 `/station-route.html` 주소도 사용할 수 있습니다.

## 코드 구성

- `index.html`: 첫 화면의 지도와 검색·GPS 조작 UI
- `public/station-route.js`: 시설 검색, 경로 그리기, GPS 수신과 지도 좌표 표시
- `public/station-route-math.js`: 최단 경로와 GPS 좌표 보정 계산
- `public/station-route.css`: 화면 스타일
- `public/daejeon-station-3f-graph.json`: 시설과 통로 연결 데이터
- `public/assets/daejeon_3d_F3(5).png`: 3층 배경 지도
- `public/gps-anchors.json`: 현장 GPS 기준점. 현재 빈 배열

GPS 기준점이 비어 있으면 위도·경도는 보여도 지도 위 현재 위치는 표시되지 않습니다. 현장에서 측정한 비공선 기준점 3개 이상을 입력하고 HTTPS 또는 localhost에서 위치 권한을 허용해야 합니다. 검증 절차는 `docs/STATION_ROUTE_TEST.md`에 있습니다.
