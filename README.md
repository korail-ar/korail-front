# 대전역 웹앱

이 웹앱에는 대전 축제 정보와 대전역 3층 경로 지도 두 화면이 있습니다. AR 기능은 포함하지 않습니다.

## 실행

Node.js 22 이상에서 `npm install` 후 `npm run dev`를 실행합니다. `.env.example`을 `.env`로 복사하고 `TOUR_API_SERVICE_KEY`에 공공데이터포털 일반 인증키를 입력해야 축제 정보를 불러올 수 있습니다. `npm test`로 핵심 계산을 확인하고 `npm run build`로 배포 파일을 만듭니다.

- `/`: 3층 시설 검색, 경로 표시, 단계별 안내
- `/festivals.html`: 진행 중이거나 예정된 대전 축제 최대 3개
- `/gps-test.html`: 위치 수신과 지도 좌표 보정을 확인하는 별도 테스트 화면

## 코드 흐름

지도 화면은 `index.html`과 `public/station-route.js`가 담당합니다. 시설 및 통로 정보는 `public/daejeon-station-3f-graph.json`, 경로·GPS 좌표 계산은 `public/station-route-math.js`에 있습니다. 축제 화면은 `public/festivals.html`과 `public/festivals.js`가 담당합니다. 브라우저는 `/api/festivals`를 호출하고 서버의 `festival.js`가 TourAPI를 조회하므로 인증키는 브라우저에 노출되지 않습니다. 로컬 개발 서버는 `vite.config.js`, Vercel 배포는 `api/festivals.js`가 같은 API 경로를 제공합니다.

검색은 시설명·별칭의 부분 일치와 단어 순서 변경을 지원하고, 긴 단어의 한 글자 오차도 허용합니다. 경로 계산 뒤에는 출발지·목적지 요약, 전체 지도, 단계별 안내가 순서대로 나타납니다. `public/route-steps.js`가 다익스트라 경로의 노드를 분기점과 목적지 접근점에서 묶습니다. 단계를 선택하면 해당 노드 구간을 지도에서 강조하고 중심으로 이동합니다. 거리와 소요 시간은 지도 좌표가 이미지 픽셀이므로 표시하지 않습니다.

GPS 테스트는 일반 길찾기 화면과 분리한 `public/gps-test.html` 및 `public/gps-diagnostics.js`에서 수행합니다. 기준점 파일 `public/gps-anchors.json`은 현재 빈 배열입니다. 위도·경도는 받을 수 있지만 지도 위 현재 위치는 현장에서 측정한 비공선 기준점 3개 이상을 입력한 뒤 표시할 수 있습니다. 위치 권한은 HTTPS 또는 localhost에서 허용해야 합니다. 지도 검증 절차는 `docs/STATION_ROUTE_TEST.md`에 있습니다.
