import { browserLocationProvider } from './location-provider.js';
import { calibration, candidatePreview, smoothPosition, validPosition, matchEdge, edgeCandidates } from './gps-location.js';
import { constrainToFloor, routeProjection, navigationDecision } from './gps-navigation.js';
import { project, localMeters } from './station-route-math.js';
import { nearestReachablePlace, routeToPlace, sessionSummary, sessionCsv } from './gps-session.js';
import { createStepDetector, routePointAtMeters } from './step-assist.js';

const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => { const node = document.createElementNS(NS, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
let settings, points, graph, stopWatch, lastSample, smoothed, pendingJump, lastRaw, lastPoint, correction, manualAnchor, match, route, destination, walking = false, streak = 0, previousProgress, lastReroute = 0, zoom = 1, rotation = 0, request = 0, phase = 'unmarked';
let rows = [], counters = { distance: 0, offRoute: 0, reroutes: 0, uncertain: 0 }, lastAccepted;
let stopSteps, stepCount = 0, stepMeters = 0, stepRequest = 0, motionTimeout;
const floorConfig = () => settings.floors.find(item => item.floor === Number($('floor').value));
const note = value => { $('status').textContent = value; };
function chooseDestination(place) {
  destination = place;
  $('destination').value = place?.id || '';
  if (walking && match && destination) routeForCurrent();
}
function showDestinations() {
  if (!graph) return;
  const query = $('destinationSearch').value.trim().toLocaleLowerCase('ko-KR');
  const filtered = graph.places.filter(place => place.name.toLocaleLowerCase('ko-KR').includes(query));
  const select = $('destination');
  select.replaceChildren(new Option(filtered.length ? '목적지를 선택하세요' : '검색 결과 없음', ''));
  for (const place of filtered) select.add(new Option(place.name, place.id));
  if (destination && filtered.some(place => place.id === destination.id)) select.value = destination.id;
  else if (query && filtered.length === 1) chooseDestination(filtered[0]);
  else if (destination && query) destination = null;
}
function recommend() {
  if (!graph || !match || destination) return;
  const nearest = nearestReachablePlace(graph, match);
  if (nearest) { chooseDestination(nearest.place); note(`추천 목적지: ${nearest.place.name} · 미검증 시험 경로`); }
}
function drawRoute() {
  const layer = $('routeLayer'); layer.replaceChildren();
  if (!route) return;
  layer.append(svg('polyline', { points: route.points.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: '#17324c', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  layer.append(svg('polyline', { points: route.points.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: '#ffdf3d', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}
function drawPosition(point, raw, accuracy, fit, uncertain) {
  const layer = $('positionLayer'); layer.replaceChildren();
  if (!point) return;
  const [a, b, , d, e] = fit.p, [x, y] = [point.x, point.y];
  if (raw && correction) layer.append(svg('circle', { cx: raw.x, cy: raw.y, r: 10, fill: 'none', stroke: '#1a73e8', 'stroke-dasharray': '5 3', 'stroke-width': 3 }));
  // The transformed circle becomes an ellipse when the calibration rotates or scales axes differently.
  layer.append(svg('circle', { cx: 0, cy: 0, r: accuracy, transform: `matrix(${a} ${d} ${b} ${e} ${x} ${y})`, fill: '#1a73e833', stroke: '#1a73e8', 'stroke-width': 2 / Math.sqrt(Math.max(1e-9, Math.abs(a * e - b * d))) }));
  layer.append(svg('circle', { cx: x, cy: y, r: 10, fill: correction ? '#7545ae' : '#1a73e8', stroke: '#fff', 'stroke-width': 3, opacity: uncertain ? 0.55 : 1 }));
}
function routeForCurrent() {
  if (!graph || !match || !destination) return false;
  route = routeToPlace(graph, match, destination);
  drawRoute();
  previousProgress = null; streak = 0;
  stepMeters = 0; $('stepLayer').replaceChildren();
  if (stopSteps) $('stepStatus').textContent = `걸음 추정 ${stepCount}걸음 · 새 출발점부터 0m`;
  return Boolean(route);
}
function stopStepAssist() {
  stepRequest++;
  clearTimeout(motionTimeout);
  stopSteps?.(); stopSteps = null;
  $('stepsOn').textContent = '걸음 보조 켜기';
}
function onStep() {
  if (!walking || !route) return;
  const stride = Number($('stride').value);
  if (!Number.isFinite(stride) || stride < 0.3 || stride > 1.2) return;
  stepCount++;
  stepMeters += stride;
  const capped = Math.min(25, stepMeters);
  const point = routePointAtMeters(route, capped);
  if (point) $('stepLayer').replaceChildren(svg('circle', { cx: point.x, cy: point.y, r: 12, fill: '#f28c28', stroke: '#fff', 'stroke-width': 3, 'data-role': 'step-estimate' }));
  const state = stepMeters > 25 ? '25m 한계 · 지도에서 위치를 다시 지정하세요' : '계획 경로를 따라간다는 가정';
  $('stepStatus').textContent = `걸음 추정 ${stepCount}걸음 · 마지막 위치 지정 이후 ${stepMeters.toFixed(1)}m · ${state}`;
  rows.push({ eventType: 'step', timestamp: Date.now(), phase, floor: floorConfig().floor, mapId: floorConfig().mapId, stepCount, strideM: stride, stepDistanceM: stepMeters, stepX: point?.x, stepY: point?.y, state, source: 'device-motion-estimate' });
}
function accept(sample, record = true) {
  const wrapped = { coords: sample, timestamp: sample.timestamp }, invalid = validPosition(wrapped);
  if (invalid) { note(invalid); if (record) { counters.uncertain++; rows.push({ ...sample, eventType: 'sample', phase, floor: Number($('floor').value), state: invalid, source: 'browser-geolocation' }); } return; }
  if (smoothed && sample.timestamp - smoothed.timestamp > 15000) smoothed = null;
  const nextSmoothed = smoothPosition(smoothed, wrapped);
  if (smoothed && nextSmoothed === smoothed) {
    const repeated = pendingJump && Math.hypot(...localMeters(sample.latitude, sample.longitude, { lat: pendingJump.coords.latitude, lng: pendingJump.coords.longitude })) <= Math.max(8, sample.accuracy + pendingJump.coords.accuracy);
    pendingJump = wrapped;
    if (repeated) { smoothed = wrapped; pendingJump = null; }
  } else { smoothed = nextSmoothed; pendingJump = null; }
  const previousSample = lastSample;
  lastSample = sample;
  if (!settings || !graph) { note('지도 자료를 불러오는 중'); return; }
  const config = floorConfig(), calibrated = calibration(config), verified = config.status === 'validated' && calibrated.fit && calibrated.errors.length;
  const fit = verified ? calibrated.fit : candidatePreview(points, config.floor);
  if (!fit) { note('위치 확인 필요 · 이 층의 GPS 대응 좌표가 없습니다'); counters.uncertain++; return; }
  const [rawX, rawY] = project(fit, smoothed.coords.latitude, smoothed.coords.longitude);
  lastRaw = { x: rawX, y: rawY };
  if (manualAnchor && !correction) correction = { dx: manualAnchor.x - rawX, dy: manualAnchor.y - rawY };
  const point = constrainToFloor({ x: rawX + (correction?.dx || 0), y: rawY + (correction?.dy || 0) }, config.viewBox);
  const [a, b, , d, e] = fit.p, trace = a * a + b * b + d * d + e * e, determinant = a * e - b * d;
  const errorPx = sample.accuracy * Math.sqrt((trace + Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant))) / 2);
  const possible = !point.limited && sample.accuracy <= 30;
  const nearby = possible ? edgeCandidates(graph, point, Math.max(12, errorPx), true) : [];
  const nearestEdge = edgeCandidates(graph, point, Infinity, true)[0];
  const candidate = possible ? matchEdge(graph, point, Math.max(12, errorPx), match, true) || (match && nearby.find(item => item.edge.id === match.edge.id)) : null;
  const priorMatch = match;
  if (candidate) match = candidate;
  const activeMatch = candidate;
  const uncertain = !possible || !activeMatch || (!verified && !correction);
  if (uncertain && record) counters.uncertain++;
  const accepted = activeMatch && !uncertain ? { x: activeMatch.x, y: activeMatch.y } : null;
  if (record && accepted && lastAccepted) {
    const movement = Math.hypot(...localMeters(sample.latitude, sample.longitude, lastAccepted));
    if (movement > Math.max(3, sample.accuracy, lastAccepted.accuracy) && movement < Math.max(30, sample.accuracy + lastAccepted.accuracy + 10)) counters.distance += movement;
  }
  if (record && accepted) lastAccepted = { lat: sample.latitude, lng: sample.longitude, accuracy: sample.accuracy };
  lastPoint = point;
  drawPosition(point, lastRaw, sample.accuracy, fit, uncertain);
  let state = uncertain ? '위치 확인 필요' : '양호';
  let routeDistanceSvg = route ? routeProjection(route.points, point).distance : null;
  if (walking && route && !uncertain && record) {
    const projected = routeProjection(route.points, accepted);
    routeDistanceSvg = projected.distance;
    const current = { ...projected, ...accepted, timestamp: sample.timestamp };
    const decision = navigationDecision(previousProgress, current, errorPx, streak, true);
    streak = decision.offRoute; previousProgress = current;
    state = streak ? '경로 이탈 의심' : '정상 이동';
    if (streak === 1) counters.offRoute++;
    if (projected.total - projected.progress < Math.max(12, errorPx) && destination && Math.hypot(accepted.x - destination.x, accepted.y - destination.y) < Math.max(12, errorPx)) state = '목적지 도착';
    if (decision.reroute && priorMatch && activeMatch.edge.id === priorMatch.edge.id) state = '위치 확인 필요';
    else if (decision.reroute && Date.now() - lastReroute > 15000 && activeMatch && routeForCurrent()) { counters.reroutes++; lastReroute = Date.now(); state = '경로 재탐색'; }
  }
  const uncertaintyReason = point.limited ? '도면 밖 추정' : sample.accuracy > 30 ? '측정 오차 30m 초과' : !nearby.length ? '근처 통로 없음' : !candidate ? '통로 후보가 모호함' : !verified && !correction ? '지도 보정 미완료' : '';
  note(uncertain ? `위치 확인 필요 · ${uncertaintyReason}` : state);
  const rawChange = previousSample ? Math.hypot(...localMeters(sample.latitude, sample.longitude, { lat: previousSample.latitude, lng: previousSample.longitude })) : null;
  $('details').textContent = `정확도 ±${Math.round(sample.accuracy)}m · ${config.floor}층 · 새 수신 ${new Date(sample.timestamp).toLocaleTimeString('ko-KR')} · 좌표 변화 ${rawChange == null ? '첫 측정' : `${rawChange.toFixed(1)}m (측정값)`}`;
  $('advanced').textContent = `mapId: ${config.mapId} · 보정: ${verified ? '검증 설정' : '미검증 추정'} · 통로: ${activeMatch?.edge.id || '불명확'} · 위도: ${sample.latitude.toFixed(7)} · 경도: ${sample.longitude.toFixed(7)}`;
  if (record) rows.push({ ...sample, eventType: 'sample', phase, floor: config.floor, mapId: config.mapId, rawX, rawY, x: point.x, y: point.y, correctionDx: correction?.dx, correctionDy: correction?.dy, positionBasis: correction ? 'manual-offset' : verified ? 'validated-affine' : 'candidate-preview', boundaryLimited: point.limited, matchedX: activeMatch?.x, matchedY: activeMatch?.y, edgeId: activeMatch?.edge.id, nearestEdgeId: nearestEdge?.edge.id, nearestEdgeDistanceSvg: nearestEdge?.distance, nearbyEdgeCount: nearby.length, matchReason: point.limited ? 'outside-viewBox' : sample.accuracy > 30 ? 'accuracy-over-30m' : !nearby.length ? 'no-nearby-edge' : !candidate ? 'ambiguous-edges' : !verified && !correction ? 'uncalibrated-map' : 'matched', routeActive: walking && Boolean(route), destinationId: destination?.id, routeEdgeIds: route?.route.edgeIds.join('|'), routeDistanceSvg, offRouteStreak: streak, state, source: 'browser-geolocation' });
  if (!destination && activeMatch) recommend();
}
async function loadFloor() {
  const token = ++request, config = floorConfig();
  stopStepAssist();
  graph = null; match = route = destination = correction = manualAnchor = pendingJump = smoothed = lastAccepted = previousProgress = lastRaw = lastSample = null; streak = 0; walking = false; stepMeters = 0;
  $('positionLayer').replaceChildren(); $('stepLayer').replaceChildren(); drawRoute(); $('destination').disabled = true; $('destinationSearch').value = '';
  $('floorImage').setAttribute('href', `/assets/daejeon_marked_plans_and_coordinates/floor_${config.floor}_marked.svg`);
  $('map').setAttribute('viewBox', config.viewBox.join(' '));
  for (const [key, value] of Object.entries({ x: config.viewBox[0], y: config.viewBox[1], width: config.viewBox[2], height: config.viewBox[3] })) $('floorImage').setAttribute(key, value);
  $('calibrationStatus').textContent = `${config.status} · 시험용 추정 좌표/통로 · 현장 검증 전`;
  try {
    const response = await fetch(`/assets/json/gps-test-floor-${config.floor}.json`);
    if (!response.ok) throw Error('경로 자료 로드 실패');
    const loaded = await response.json();
    if (token !== request) return;
    if (loaded.mapId !== config.mapId || loaded.weightUnit !== 's') throw Error('지도와 그래프가 맞지 않습니다');
    graph = loaded;
    showDestinations();
    $('destination').disabled = false;
  } catch (error) { note(error.message); }
}
function finish() {
  stopWatch?.(); stopWatch = null; stopStepAssist(); walking = false; $('stop').disabled = true; $('measure').disabled = false;
  const result = sessionSummary(rows, counters);
  $('summary').textContent = `수신 ${result.samples}건 · 평균 측정 정확도 ${result.meanAccuracy == null ? '—' : `±${result.meanAccuracy.toFixed(0)}m`} · GPS 이동 추정 ${result.estimatedDistance.toFixed(0)}m · 걸음 추정 ${stepCount}걸음 · 이탈 의심 ${result.offRoute}회 · 재탐색 ${result.reroutes}회 · 위치 불확실 ${result.uncertain}회 (실제 보행 거리와 다를 수 있음)`;
  $('scenarios').textContent = `A 위치 정확도: 판단 불가 · B 정상 이동: ${rows.some(r => r.state === '정상 이동') && counters.distance >= 20 ? '성공 (시험)' : '판단 불가'} · C 다른 통로: ${counters.reroutes ? '성공 (시험)' : '판단 불가'} · 도면 기준점과 실제 출입구 검증 전에는 현장 정확도를 판정할 수 없습니다.`;
  $('csv').disabled = !rows.length; note('테스트 종료');
}
try {
  const responses = await Promise.all(['/gps-calibration.json', '/gps-points.json'].map(url => fetch(url)));
  if (responses.some(r => !r.ok)) throw Error('지도 설정을 읽을 수 없습니다');
  [settings, { points }] = await Promise.all(responses.map(r => r.json()));
  await loadFloor();
} catch (error) { note(`초기화 실패: ${error.message}`); }
$('measure').onclick = () => {
  if (stopWatch) return;
  rows = []; counters = { distance: 0, offRoute: 0, reroutes: 0, uncertain: 0 }; lastAccepted = null; lastSample = null; smoothed = pendingJump = null; phase = 'unmarked'; stepCount = stepMeters = 0; $('phase').value = phase;
  $('summary').textContent = '측정 중'; $('csv').disabled = true;
  try {
    stopWatch = browserLocationProvider().subscribe(accept, error => { counters.uncertain++; note(error.code === 1 ? '위치 권한이 거부되었습니다' : error.code === 3 ? '위치 수신 시간 초과' : '위치 수신 실패'); });
    $('stop').disabled = false; $('measure').disabled = true; note('현재 위치 측정 중');
  } catch (error) { note(error.message); }
};
$('walk').onclick = () => { if (!graph) { note('시설 자료를 불러오는 중입니다'); return; } if (!match) { note('지도에서 실제 출발점을 한 번 눌러 주세요'); $('viewport').scrollIntoView?.({ behavior: 'smooth', block: 'center' }); return; } if (!destination) { note('목적지를 검색하거나 목록에서 선택해 주세요'); $('destinationSearch').focus(); return; } if (!routeForCurrent()) { note('선택한 목적지까지 연결된 시험 경로가 없습니다'); return; } walking = true; if (!stopWatch) $('measure').click(); note(stopWatch ? '이동 테스트 중 · 위치 수신 대기' : '위치 권한을 확인해 주세요'); };
$('stop').onclick = finish;
$('floor').onchange = () => { $('details').textContent = `정확도 — · ${$('floor').value}층 · 위치 확인 필요`; loadFloor(); note('층 변경 · 새 위치 대기'); };
$('destination').onchange = () => chooseDestination(graph?.places.find(place => place.id === $('destination').value) || null);
$('destinationSearch').oninput = showDestinations;
$('map').onclick = event => {
  if (!graph) { note('지도 자료를 불러오는 중입니다'); return; }
  const map = $('map'), matrix = map.getScreenCTM?.();
  if (!matrix) { note('지도 위치를 읽을 수 없습니다'); return; }
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  const fixed = constrainToFloor(p, floorConfig().viewBox);
  match = edgeCandidates(graph, fixed, 24, true)[0] || null;
  if (!match) { note('근처 통로를 찾을 수 없습니다. 지도에서 통로를 눌러 주세요'); return; }
  manualAnchor = fixed;
  rows.push({ eventType: 'manual-anchor', timestamp: Date.now(), phase, floor: floorConfig().floor, mapId: floorConfig().mapId, x: fixed.x, y: fixed.y, edgeId: match.edge.id, state: '출발점 수동 지정', source: 'user' });
  if (lastRaw && lastSample) { correction = { dx: fixed.x - lastRaw.x, dy: fixed.y - lastRaw.y }; accept(lastSample, false); }
  else {
    $('positionLayer').replaceChildren(svg('circle', { cx: match.x, cy: match.y, r: 11, fill: '#7545ae', stroke: '#fff', 'stroke-width': 3 }));
  }
  recommend();
  if (walking && destination) routeForCurrent();
  note('출발 위치 지정됨 · 목적지를 선택하고 이동 테스트를 시작하세요');
};
$('phase').onchange = () => { phase = $('phase').value; rows.push({ eventType: 'phase-change', timestamp: Date.now(), phase, floor: floorConfig()?.floor, mapId: floorConfig()?.mapId, state: '현장 구간 표시', source: 'user' }); };
$('stepsOn').onclick = async () => {
  if (stopSteps) { stopStepAssist(); $('stepStatus').textContent = '걸음 보조 꺼짐'; return; }
  if (!walking || !route) { $('stepStatus').textContent = '먼저 이동 테스트를 시작하세요'; return; }
  const stride = Number($('stride').value);
  if (!Number.isFinite(stride) || stride < 0.3 || stride > 1.2) { $('stepStatus').textContent = '보폭은 0.3~1.2m로 입력하세요'; return; }
  if (!globalThis.isSecureContext || !('DeviceMotionEvent' in globalThis)) { $('stepStatus').textContent = '이 브라우저에서는 모션 센서를 사용할 수 없습니다'; return; }
  const requestId = ++stepRequest;
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function' && await DeviceMotionEvent.requestPermission() !== 'granted') { $('stepStatus').textContent = '모션 센서 권한이 거부되었습니다'; return; }
    if (requestId !== stepRequest || !walking) return;
    const detect = createStepDetector();
    const motion = event => {
      clearTimeout(motionTimeout);
      const a = event.accelerationIncludingGravity;
      if (a && [a.x, a.y, a.z].every(Number.isFinite) && detect(Math.hypot(a.x, a.y, a.z))) onStep();
    };
    window.addEventListener('devicemotion', motion);
    stopSteps = () => window.removeEventListener('devicemotion', motion);
    $('stepsOn').textContent = '걸음 보조 끄기';
    $('stepStatus').textContent = '센서 수신 대기 · 휴대폰을 들고 걸어 보세요';
    motionTimeout = setTimeout(() => { if (stopSteps) $('stepStatus').textContent = '센서 값이 들어오지 않습니다 · 모션 권한과 브라우저 지원을 확인하세요'; }, 5000);
  } catch { $('stepStatus').textContent = '모션 센서를 시작할 수 없습니다'; }
};
for (const [id, factor] of [['zoomIn', 1.3], ['zoomOut', 1 / 1.3]]) $(id).onclick = () => { zoom = Math.max(1, Math.min(4, zoom * factor)); $('scene').style.width = `${zoom * 100}%`; };
$('rotate').onclick = () => { rotation = (rotation + 90) % 360; $('map').style.transform = `rotate(${rotation}deg)`; };
$('csv').onclick = () => { const url = URL.createObjectURL(new Blob([sessionCsv(rows)], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'daejeon-gps-test.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
window.addEventListener('pagehide', () => { stopWatch?.(); stopStepAssist(); });
setInterval(() => { if (stopWatch && lastSample && Date.now() - lastSample.timestamp > 15000) { note('위치 확인 필요 · 새 위치 수신 중단'); $('positionLayer').replaceChildren(); } }, 1000);
