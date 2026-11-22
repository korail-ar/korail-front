import { browserLocationProvider } from './location-provider.js';
import { calibration, candidatePreview, smoothPosition, validPosition, matchEdge, edgeCandidates } from './gps-location.js';
import { constrainToFloor, routeProjection, navigationDecision } from './gps-navigation.js';
import { project, localMeters } from './station-route-math.js';
import { nearestReachablePlace, routeToPlace, sessionSummary, sessionCsv } from './gps-session.js';

const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => { const node = document.createElementNS(NS, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
let settings, points, graph, stopWatch, lastSample, smoothed, lastRaw, lastPoint, correction, match, route, destination, walking = false, streak = 0, previousProgress, lastReroute = 0, zoom = 1, rotation = 0, request = 0;
let rows = [], counters = { distance: 0, offRoute: 0, reroutes: 0, uncertain: 0 }, lastAccepted;
const floorConfig = () => settings.floors.find(item => item.floor === Number($('floor').value));
const note = value => { $('status').textContent = value; };
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
  return Boolean(route);
}
function accept(sample) {
  const wrapped = { coords: sample, timestamp: sample.timestamp }, invalid = validPosition(wrapped);
  if (invalid) { note(invalid); counters.uncertain++; rows.push({ ...sample, floor: Number($('floor').value), state: invalid, source: 'browser-geolocation' }); return; }
  if (smoothed && sample.timestamp - smoothed.timestamp > 15000) smoothed = null;
  smoothed = smoothPosition(smoothed, wrapped);
  lastSample = sample;
  if (!settings || !graph) { note('지도 자료를 불러오는 중'); return; }
  const config = floorConfig(), calibrated = calibration(config), verified = config.status === 'validated' && calibrated.fit && calibrated.errors.length;
  const fit = verified ? calibrated.fit : candidatePreview(points, config.floor);
  if (!fit) { note('위치 확인 필요 · 이 층의 GPS 대응 좌표가 없습니다'); counters.uncertain++; return; }
  const [rawX, rawY] = project(fit, smoothed.coords.latitude, smoothed.coords.longitude);
  lastRaw = { x: rawX, y: rawY };
  const point = constrainToFloor({ x: rawX + (correction?.dx || 0), y: rawY + (correction?.dy || 0) }, config.viewBox);
  const [a, b, , d, e] = fit.p, trace = a * a + b * b + d * d + e * e, determinant = a * e - b * d;
  const errorPx = sample.accuracy * Math.sqrt((trace + Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant))) / 2);
  const possible = !point.limited && sample.accuracy <= 30;
  const candidate = possible ? matchEdge(graph, point, Math.max(12, errorPx), match, true) : null;
  const priorMatch = match;
  if (candidate) match = candidate;
  const activeMatch = candidate || (correction ? match : null);
  const uncertain = !possible || !activeMatch || (!verified && !correction);
  if (uncertain) counters.uncertain++;
  const accepted = activeMatch && !uncertain ? { x: activeMatch.x, y: activeMatch.y } : null;
  if (accepted && lastAccepted) {
    const movement = Math.hypot(...localMeters(sample.latitude, sample.longitude, lastAccepted));
    if (movement > Math.max(3, sample.accuracy, lastAccepted.accuracy) && movement < Math.max(30, sample.accuracy + lastAccepted.accuracy + 10)) counters.distance += movement;
  }
  if (accepted) lastAccepted = { lat: sample.latitude, lng: sample.longitude, accuracy: sample.accuracy };
  lastPoint = point;
  drawPosition(point, lastRaw, sample.accuracy, fit, uncertain);
  let state = uncertain ? '위치 확인 필요' : '양호';
  if (walking && route && !uncertain) {
    const projected = routeProjection(route.points, accepted);
    const current = { ...projected, ...accepted, timestamp: sample.timestamp };
    const decision = navigationDecision(previousProgress, current, errorPx, streak, true);
    streak = decision.offRoute; previousProgress = current;
    state = streak ? '경로 이탈 의심' : '정상 이동';
    if (streak === 1) counters.offRoute++;
    if (projected.total - projected.progress < Math.max(12, errorPx) && destination && Math.hypot(accepted.x - destination.x, accepted.y - destination.y) < Math.max(12, errorPx)) state = '목적지 도착';
    if (decision.reroute && priorMatch && activeMatch.edge.id === priorMatch.edge.id) state = '위치 확인 필요';
    else if (decision.reroute && Date.now() - lastReroute > 15000 && activeMatch && routeForCurrent()) { counters.reroutes++; lastReroute = Date.now(); state = '경로 재탐색'; }
  }
  note(state);
  $('details').textContent = `정확도 ±${Math.round(sample.accuracy)}m · ${config.floor}층 · ${uncertain ? '확인 필요' : '양호'} · ${new Date(sample.timestamp).toLocaleTimeString('ko-KR')}`;
  $('advanced').textContent = `mapId: ${config.mapId} · 보정: ${verified ? '검증 설정' : '미검증 추정'} · 통로: ${activeMatch?.edge.id || '불명확'} · 위도: ${sample.latitude.toFixed(7)} · 경도: ${sample.longitude.toFixed(7)}`;
  rows.push({ ...sample, floor: config.floor, mapId: config.mapId, x: point.x, y: point.y, matchedX: activeMatch?.x, matchedY: activeMatch?.y, edgeId: activeMatch?.edge.id, state, source: 'browser-geolocation' });
  if (!destination && activeMatch) {
    const nearest = nearestReachablePlace(graph, activeMatch);
    if (nearest) { destination = nearest.place; $('destination').value = destination.id; $('walk').disabled = false; }
  }
}
async function loadFloor() {
  const token = ++request, config = floorConfig();
  graph = null; match = route = destination = correction = smoothed = lastAccepted = previousProgress = null; streak = 0; walking = false;
  $('positionLayer').replaceChildren(); drawRoute(); $('walk').disabled = true; $('destination').disabled = true;
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
    $('destination').replaceChildren(new Option('위치 측정 후 자동 추천', ''));
    for (const place of graph.places) $('destination').add(new Option(place.name, place.id));
    $('destination').disabled = false;
  } catch (error) { note(error.message); }
}
function finish() {
  stopWatch?.(); stopWatch = null; walking = false; $('stop').disabled = true; $('measure').disabled = false;
  const result = sessionSummary(rows, counters);
  $('summary').textContent = `수신 ${result.samples}건 · 평균 측정 정확도 ${result.meanAccuracy == null ? '—' : `±${result.meanAccuracy.toFixed(0)}m`} · 이동 추정 ${result.estimatedDistance.toFixed(0)}m · 이탈 의심 ${result.offRoute}회 · 재탐색 ${result.reroutes}회 · 위치 불확실 ${result.uncertain}회 (실제 보행 거리와 다를 수 있음)`;
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
  rows = []; counters = { distance: 0, offRoute: 0, reroutes: 0, uncertain: 0 }; lastAccepted = null; lastSample = null; smoothed = null;
  $('summary').textContent = '측정 중'; $('csv').disabled = true;
  try {
    stopWatch = browserLocationProvider().subscribe(accept, error => { counters.uncertain++; note(error.code === 1 ? '위치 권한이 거부되었습니다' : error.code === 3 ? '위치 수신 시간 초과' : '위치 수신 실패'); });
    $('stop').disabled = false; $('measure').disabled = true; note('현재 위치 측정 중');
  } catch (error) { note(error.message); }
};
$('walk').onclick = () => { if (!routeForCurrent()) { note('위치 또는 목적지를 확인해 주세요'); return; } walking = true; note('정상 이동 · 시험 경로'); };
$('stop').onclick = finish;
$('floor').onchange = () => { $('details').textContent = `정확도 — · ${$('floor').value}층 · 위치 확인 필요`; loadFloor(); note('층 변경 · 새 위치 대기'); };
$('destination').onchange = () => { destination = graph?.places.find(place => place.id === $('destination').value) || null; $('walk').disabled = !destination || !match; if (walking && destination) routeForCurrent(); };
$('map').onclick = event => {
  if (!lastRaw || !lastSample) { note('먼저 위치를 측정해 주세요'); return; }
  const map = $('map'), matrix = map.getScreenCTM?.();
  if (!matrix) return;
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  const fixed = constrainToFloor(p, floorConfig().viewBox);
  correction = { dx: fixed.x - lastRaw.x, dy: fixed.y - lastRaw.y };
  match = edgeCandidates(graph, fixed, 24, true)[0] || null;
  accept(lastSample); note(match ? '사용자 지정 위치 · 새 측정으로 계속 추적' : '근처 통로를 찾을 수 없습니다');
};
for (const [id, factor] of [['zoomIn', 1.3], ['zoomOut', 1 / 1.3]]) $(id).onclick = () => { zoom = Math.max(1, Math.min(4, zoom * factor)); $('scene').style.width = `${zoom * 100}%`; };
$('rotate').onclick = () => { rotation = (rotation + 90) % 360; $('map').style.transform = `rotate(${rotation}deg)`; };
$('csv').onclick = () => { const url = URL.createObjectURL(new Blob([sessionCsv(rows)], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'daejeon-gps-test.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
window.addEventListener('pagehide', () => stopWatch?.());
setInterval(() => { if (stopWatch && lastSample && Date.now() - lastSample.timestamp > 15000) { note('위치 확인 필요 · 새 위치 수신 중단'); $('positionLayer').replaceChildren(); } }, 1000);
