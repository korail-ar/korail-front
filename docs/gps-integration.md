# GPS와 도면 좌표

`public/gps-points.json`은 첨부 `floor_points_expanded.json`의 107개 도면 지점을 원본 ID와 원본 SVG 좌표로 연결한 읽기 전용 데이터다. `candidateGps`는 미검증 추정값이며 보정 또는 길찾기 기준점으로 사용하지 않는다. `lat`/`lng` null은 그대로 유지한다. 도면 지점은 그래프 노드가 아니다. 원본 XLSX와 층별 표시 SVG는 `public/assets/daejeon_marked_plans_and_coordinates/`에 있다. `daejeon_station_by_floor.linked.json`은 제공되지 않았다.

`public/gps-calibration.json`의 층별 `mapId`, `viewBox`, `anchors`, `status`를 관리한다. 현장에서 동일 물리 지점의 GPS 위도·경도와 원본 SVG X·Y를 측량하고, 서로 일직선이 아닌 `training` 기준점 3개 이상과 별도 `validation` 지점 1개 이상을 입력한다. GPS 확인 화면에서 입력하고 JSON을 내려받아 파일에 반영할 수 있다. 현장 오차를 검토한 뒤에만 해당 층 `status`를 `validated`로 변경한다. 오차는 SVG 좌표 단위로 표시된다. 현장 테스트용 추정 위치 체크박스는 기존 candidateGps에서 역산한 미검증 위치를 실시간 시각화한다. 정확도 원은 기기 측정 오차를 변환한 것이며 지도 정합 오차는 포함하지 않는다. 이 표시로 실제 출입구 또는 통로 위치를 확정할 수 없다.

GPS 지도는 원본 SVG viewBox를 사용한다. 기존 3층 길찾기는 별도의 2048×1386 PNG 그래프를 사용하며, 새 도면 GPS 좌표를 그 PNG에 직접 겹치지 않는다. 층별 그래프의 `routableForPublicUse`가 false인 동안 통로 매칭과 GPS 출발 경로는 안내에 사용하지 않는다. 그래프가 검증되면 `gps-location.js`의 엣지 매칭 및 임시 출발 경로 함수를 연결할 수 있다.

휴대폰에서 HTTPS로 열거나 PC의 localhost에서 `npm run dev`를 실행한 뒤 `/gps-test.html`로 접속한다. 층을 직접 선택하고 `내 위치 지도에 표시 (미검증 시험)`를 누른다. 이 버튼은 미검증 추정 위치 표시를 명시적으로 켜고 연속 GPS 수신을 시작한다. 첫 유효 위치가 잡히면 지도를 화면에 가져온다. 투영된 위치가 지도 범위 밖이면 점을 임의로 지도 안에 넣지 않고 상태를 표시한다. 모의 위치 입력과 기록 재생은 개발용이며 현장 정합 검증을 대신하지 않는다. 위치 기록은 메모리에서만 처리한다.

## 경로와 실시간 위치 비교

`/gps-test.html`에서 층을 고른 뒤 출발지·목적지를 선택하고 `시험 경로 표시`를 누른다. 층별 후보 그래프에서 `candidateApproachNodeId`가 있는 시설만 표시하며, 노란 경로와 GPS 점은 같은 원본 SVG viewBox 안에 그린다. 후보 그래프는 `routableForPublicUse: false`이고 모든 엣지가 미검증이므로 이 경로는 현장 실험용이며 실제 길안내가 아니다. GPS 점은 경로에 자동으로 붙지 않고 새 위치 수신 때만 움직인다. 표시되는 `경로와 거리`는 SVG 좌표 단위의 도면상 거리이며 GPS·도면 정합이 완료될 때까지 경로 일치 여부를 판정하지 않는다. `public/assets/json/gps-test-floor-1.json`부터 `gps-test-floor-4.json`은 기존 층별 그래프에서 시험에 필요한 필드만 추린 자료다.
