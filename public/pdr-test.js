import { fastestRoute } from './assets/json/fastest-route.mjs';
import { edgeCandidates, routeFromEdge } from './gps-location.js';
import { StepDetector } from './location-engine/step-detector.js';
import { HeadingEstimator, wrap, difference, cardinalReading } from './location-engine/heading-estimator.js';
import { PdrEngine } from './location-engine/pdr-engine.js';
import { matchPosition } from './location-engine/map-matcher.js';
import { NavigationState } from './location-engine/navigation-state.js';
import { SensorProvider } from './location-engine/sensor-provider.js';
import { TestRecorder } from './location-engine/test-recorder.js';
import { mapCompassOffset } from './location-engine/map-orientation.js';

const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => { const node = document.createElementNS(NS, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
const detector = new StepDetector(), heading = new HeadingEstimator(), pdr = new PdrEngine(), navigation = new NavigationState(), recorder = new TestRecorder();
let graph, floor = 3, request = 0, selected = null, confirmed = null, match = null, route = null, destination = null, pixelsPerMeter = null, scaleVerified = false;
let running = false, source = 'real', lastMotionAt = 0, lastStepHeading = null, uncertainHeading = true, measurePoints = null, motionSamples = 0;
let compassOffset = null;
const logs = [];
const log = message => { logs.unshift(`${new Date().toLocaleTimeString('ko-KR')} ${message}`); logs.length = Math.min(logs.length, 12); $('log').textContent = logs.join('\n'); };
const status = message => { $('status').textContent = message; $('notice').textContent = message; };
const option = (name, value) => { const item = document.createElement('option'); item.textContent = name; item.value = value; return item; };
function graphScale(data) {
  const nodes = new Map(data.nodes.map(node => [node.id, node]));
  const ratios = data.edges.filter(edge => edge.selectedDistanceM > 0).slice(0, 1500).map(edge => { const a = nodes.get(edge.source), b = nodes.get(edge.target); return a && b ? Math.hypot(a.x - b.x, a.y - b.y) / edge.selectedDistanceM : NaN; }).filter(value => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 2)] ?? null;
}
async function loadFloor() {
  const id = ++request;
  stop(); graph = null; selected = confirmed = match = route = destination = null; pdr.reset(); navigation.reset(); heading.reset(); detector.reset(); uncertainHeading = true;
  floor = Number($('floor').value); $('guide').textContent = '지도와 그래프를 불러오는 중'; draw();
  try {
    const response = await fetch(`/assets/json/gps-test-floor-${floor}.json`);
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const data = await response.json(); if (id !== request) return;
    if (data.floor !== floor || data.mapId !== `daejeon-station-${floor}F-map.svg`) throw Error('지도와 그래프 좌표계 불일치');
    graph = data; pixelsPerMeter = graphScale(data); scaleVerified = false;
    compassOffset = null;
    if (floor === 1 || floor === 3) {
      try {
        const points = (await (await fetch('/gps-points.json')).json()).points.filter(point => point.floor === floor);
        const west = points.find(point => point.name.includes('서광장') && point.candidateGps);
        const east = points.find(point => point.name.includes('동광장') && point.candidateGps);
        if (west && east) compassOffset = mapCompassOffset({ ...west, ...west.candidateGps }, { ...east, ...east.candidateGps });
      } catch { /* manual alignment remains available */ }
    }
    $('compassStatus').textContent = compassOffset === null ? '이 층은 지도 방향 기준이 없어 나침반과 지도 정렬을 보류합니다.' : `동·서광장 기준 지도 회전 ${compassOffset.toFixed(0)}° · 지리 좌표 미검증, 지도 정렬은 잠정값`;
    const boxes = { 1: [0, 0, 984, 2039], 2: [0, 0, 700, 589], 3: [0, 0, 1861, 1961], 4: [0, 0, 700, 1033] };
    const [x, y, width, height] = boxes[floor]; $('map').setAttribute('viewBox', boxes[floor].join(' '));
    Object.entries({ x, y, width, height }).forEach(([key, value]) => $('floorImage').setAttribute(key, value));
    $('floorImage').setAttribute('href', `/assets/daejeon_marked_plans_and_coordinates/floor_${floor}_marked.svg`);
    $('destination').replaceChildren(option('목적지 선택', ''));
    data.places.filter(place => place.nodeId).forEach(place => $('destination').add(option(place.name, place.id)));
    const recommended = data.places.find(place => place.nodeId);
    if (recommended) selectPoint({ x: recommended.x, y: recommended.y }, true);
    $('scaleStatus').textContent = pixelsPerMeter ? `그래프 거리 추정치 ${pixelsPerMeter.toFixed(2)} SVG/m · 현장 미검증. 실측 보정 권장.` : '지도 거리 비율 없음. 실측 보정이 필요합니다.';
    status('대기'); log(`${floor}층 그래프 ${data.nodes.length}노드, ${data.edges.length}엣지 로드`);
  } catch (error) { status(`지도 로드 실패: ${error.message}`); }
}
function selectPoint(point, recommendation = false) {
  if (!graph) return;
  selected = point; confirmed = null; match = null; route = null; pdr.reset(); navigation.reset();
  const candidates = edgeCandidates(graph, point, Math.max(18, pixelsPerMeter ? pixelsPerMeter * 2 : 25), true).slice(0, 12);
  $('candidate').replaceChildren(...candidates.map((candidate, index) => option(`${index + 1}. ${candidate.edge.id} · 거리 ${candidate.distance.toFixed(1)} SVG`, String(index))));
  $('candidateWrap').hidden = candidates.length < 2;
  $('candidate')._candidates = candidates;
  $('guide').textContent = recommendation ? '추천 출발점입니다. 지도에서 변경하거나 통로를 선택한 뒤 확정하세요.' : candidates.length ? '통로 후보를 확인한 뒤 이 위치를 확정하세요.' : '통로에서 너무 멉니다. 다른 지점을 선택하세요.';
  draw();
}
function confirmPoint() {
  const candidates = $('candidate')._candidates || [], index = Number($('candidate').value || 0), candidate = candidates[index];
  if (!candidate) { status('통로에서 너무 멉니다. 다른 위치를 선택하세요.'); return; }
  confirmed = { x: candidate.x, y: candidate.y }; match = candidate; pdr.reset(confirmed); navigation.reset(); lastStepHeading = null; uncertainHeading = true;
  $('guide').textContent = `출발점 ${candidate.edge.id} 선택 · 방향 보정 후 추적 시작`;
  status('출발 위치 확인 · 방향 보정 필요'); draw();
}
function drawRoute() {
  if (!graph || !confirmed) { status('먼저 출발 위치를 확정하세요'); return; }
  destination = graph.places.find(place => place.id === $('destination').value);
  if (!destination) { status('목적지를 선택하세요'); return; }
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  try {
    const result = routeFromEdge(graph, match, destination.nodeId);
    if (!result || result.points.length < 2) { status('경로를 찾지 못했습니다'); return; }
    const ids = result.ids.filter(id => id !== '__gps_start__');
    const routeEdges = [match.edge.id];
    for (let i = 1; i < ids.length; i++) {
      const part = fastestRoute(graph, ids[i - 1], ids[i]);
      routeEdges.push(...part.edgeIds);
    }
    route = { points: [{ ...confirmed }, ...ids.map(id => nodes.get(id))], edgeIds: routeEdges };
    $('guide').textContent = `${destination.name} 경로 표시 · 노란 선은 예시 지도 경로`;
    draw();
  } catch (error) { status(`경로 계산 실패: ${error.message}`); }
}
function mapHeading() {
  if (!route || route.points.length < 2) return null;
  const current = pdr.point || confirmed || route.points[0];
  let best = null;
  for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i - 1], b = route.points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    if (!length) continue;
    const t = Math.max(0, Math.min(1, ((current.x - a.x) * dx + (current.y - a.y) * dy) / length));
    const distance = Math.hypot(current.x - a.x - t * dx, current.y - a.y - t * dy);
    if (!best || distance < best.distance) best = { a, b, distance };
  }
  return best ? wrap(Math.atan2(best.b.x - best.a.x, best.a.y - best.b.y) * 180 / Math.PI) : null;
}
function autoCalibrate() {
  if (compassOffset === null || !heading.calibrateAbsolute(compassOffset)) return;
  uncertainHeading = false; lastStepHeading = heading.heading;
  $('compassStatus').textContent = `나침반 → 예시 지도 자동 정렬 · 지도 회전 ${compassOffset.toFixed(0)}° (미검증 기준점)`;
  status('나침반 자동 보정 · 잠정 방향'); updateDashboard(); draw();
}
function draw() {
  const routeLayer = $('routeLayer'), positionLayer = $('positionLayer'); routeLayer.replaceChildren(); positionLayer.replaceChildren();
  if (route?.points?.length) {
    const path = route.points.map(point => `${point.x},${point.y}`).join(' ');
    routeLayer.append(svg('polyline', { points: path, fill: 'none', stroke: '#263b4e', 'stroke-width': 13, 'stroke-linejoin': 'round' }));
    routeLayer.append(svg('polyline', { points: path, fill: 'none', stroke: '#ffcf33', 'stroke-width': 8, 'stroke-linejoin': 'round' }));
    const end = route.points.at(-1); routeLayer.append(svg('circle', { cx: end.x, cy: end.y, r: 12, fill: '#f57930', stroke: 'white', 'stroke-width': 3 }));
  }
  const point = pdr.point || selected;
  if (!point) return;
  const radius = pdr.point && pixelsPerMeter ? Math.min(250, Math.max(12, pdr.uncertaintyM * pixelsPerMeter)) : 20;
  positionLayer.append(svg('circle', { cx: point.x, cy: point.y, r: radius, fill: '#2184dd25', stroke: '#2184dd', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
  positionLayer.append(svg('circle', { cx: point.x, cy: point.y, r: 10, fill: confirmed ? '#1874ca' : '#8359bf', stroke: 'white', 'stroke-width': 3 }));
  if (confirmed && heading.heading !== null) {
    const arrow = svg('path', { d: `M ${point.x} ${point.y - 34} L ${point.x - 11} ${point.y - 17} L ${point.x + 11} ${point.y - 17} Z`, fill: uncertainHeading ? '#8c98a2' : '#1874ca', transform: `rotate(${heading.heading} ${point.x} ${point.y})` });
    positionLayer.append(arrow);
  }
}
function updateDashboard(observation = null, result = null) {
  $('steps').textContent = String(pdr.steps); $('distance').textContent = `${pdr.distanceM.toFixed(2)} m (보폭 추정)`;
  $('eastWest').textContent = pdr.directionalSteps ? `${pdr.eastM >= 0 ? '동' : '서'} ${Math.abs(pdr.eastM).toFixed(2)} m 추정` : '측정 대기';
  $('northSouth').textContent = pdr.directionalSteps ? `${pdr.northM >= 0 ? '북' : '남'} ${Math.abs(pdr.northM).toFixed(2)} m 추정` : '측정 대기';
  $('heading').textContent = heading.absolute ? cardinalReading(heading.last, heading.accuracyDegrees) : '절대 나침반 측정 불가';
  $('matching').textContent = result ? `${result.candidates.length}개 · ${result.match?.edge.id || result.reason}` : '없음';
  if (observation) $('raw').textContent = JSON.stringify(observation, null, 2);
}
function processStep(timestamp, mode = source, forcedHeading = null) {
  const direction = forcedHeading ?? heading.heading;
  if (!confirmed || mode === 'real' && (direction === null || uncertainHeading)) {
    const step = pdr.step({ heading: null, strideM: Math.min(1, Math.max(0.4, Number($('stride').value) || 0.65)), pixelsPerMeter, timestamp, source: mode });
    recorder.add({ event: 'step', floor, ...step, headingUncertain: true, navigation: '판단 보류' });
    updateDashboard(); status(confirmed ? '방향 불확실 · 걸음만 기록, 지도 이동 보류. 진행 방향을 확인하세요.' : '걸음 감지 중 · 지도 출발 위치를 선택하면 이동 추정을 시작합니다.'); return;
  }
  if (mode === 'real' && lastStepHeading !== null && Math.abs(difference(direction, lastStepHeading)) > 35) {
    uncertainHeading = true; status('방향 불확실 · 몸과 휴대폰 회전을 구분할 수 없습니다. 방향을 다시 보정하세요.'); log('큰 방향 변화 감지: 자동 이동 보류'); return;
  }
  lastStepHeading = direction;
  const strideM = Math.min(1, Math.max(0.4, Number($('stride').value) || 0.65));
  const step = pdr.step({ heading: direction, compassHeading: mode === 'real' ? heading.last : null, strideM, pixelsPerMeter, timestamp, source: mode });
  const uncertaintyPx = pdr.uncertaintyM * (pixelsPerMeter || 1);
  const result = matchPosition(graph, pdr.point, { previous: match, heading: direction, uncertaintyPx, routeEdgeIds: route?.edgeIds });
  let nav = null;
  if (!route) {
    status('집 테스트 · 걸음 기반 상대 이동 추정 중 (예시 지도)');
  } else if (result.match && pdr.uncertaintyM < 8 && scaleVerified) {
    match = result.match;
    nav = navigation.update({ routePoints: route?.points, routeEdgeIds: route?.edgeIds || [], match, heading: direction, uncertaintyPx });
    if (nav.reroute && destination) { confirmed = { x: match.x, y: match.y }; drawRoute(); status('새로운 경로를 탐색했습니다 · 추정 위치 기준'); navigation.reset(); }
    else status(nav.status);
  } else {
    status(!scaleVerified ? '지도 거리 보정 미검증 · 통로/이탈 판단 보류' : result.reason === '통로 후보가 겹침' ? '위치 재확인 · 통로 후보가 겹칩니다' : '현재 위치를 다시 지정해 주세요');
  }
  $('progress').textContent = nav?.progress === null || !nav ? '판단 보류' : `${Math.round(nav.progress * 100)}% 추정`;
  $('deviation').textContent = nav?.status || '판단 보류';
  updateDashboard(null, result); draw();
  recorder.add({ source: mode, event: 'step', floor, ...step, matchPoint: result.match && { x: result.match.x, y: result.match.y }, edgeId: result.match?.edge.id ?? null, candidateCount: result.candidates.length, routeProgress: nav?.progress ?? null, navigation: nav?.status ?? null, permission: $('sensorSupport').textContent, scaleVerified });
}
function onMotion(event) {
  if (!running || source !== 'real') return;
  const vector = event.acceleration && [event.acceleration.x, event.acceleration.y, event.acceleration.z].every(Number.isFinite) ? event.acceleration : event.accelerationIncludingGravity;
  if (!vector) { status('가속도 센서 값 없음'); return; }
  const includesGravity = vector === event.accelerationIncludingGravity, timestamp = performance.timeOrigin + event.timeStamp;
  const interval = lastMotionAt ? timestamp - lastMotionAt : null; lastMotionAt = timestamp;
  const sample = { timestamp, intervalMs: interval, acceleration: { x: vector.x, y: vector.y, z: vector.z }, includesGravity, orientation: latestOrientation, steps: pdr.steps, source: 'real' };
  const outcome = detector.push({ ...vector, includesGravity, timestamp });
  if (++motionSamples % 20 === 0) { updateDashboard({ ...sample, signal: outcome.signal.toFixed(2) }); recorder.add({ event: 'sensor', ...sample, signal: outcome.signal }); $('sensorSupport').textContent = `동작 수신 ${motionSamples}건 · 방향 ${heading.last === null ? '대기' : '수신'}`; }
  if (outcome.step) processStep(timestamp);
}
let latestOrientation = null;
function onOrientation(event) {
  if (!running || source !== 'real') return;
  if (heading.absolute && event.absolute !== true && !(Number.isFinite(event.webkitCompassHeading) && event.webkitCompassAccuracy !== -1)) return;
  latestOrientation = { alpha: event.alpha, beta: event.beta, gamma: event.gamma, absolute: event.absolute, webkitCompassHeading: event.webkitCompassHeading ?? null };
  heading.sample(event, screen.orientation?.angle ?? window.orientation ?? 0);
  if (heading.absolute && compassOffset !== null && heading.reference === null) autoCalibrate();
  if (!heading.absolute || heading.accuracyDegrees !== null && heading.accuracyDegrees > 25) { uncertainHeading = true; status('나침반 방향 불확실 · 지도 이동 보류'); }
  if (lastStepHeading !== null && heading.heading !== null && Math.abs(difference(heading.heading, lastStepHeading)) > 35) { uncertainHeading = true; status('방향 불확실 · 폰 회전 또는 실제 회전. 진행 방향을 다시 확인하세요.'); }
  updateDashboard(); draw();
}
const provider = new SensorProvider({ onMotion, onOrientation, onStatus: message => { $('sensorSupport').textContent = message; log(message); } });
async function start() {
  source = 'real'; $('source').textContent = '실제 센서'; detector.reset(); lastMotionAt = 0;
  if (!await provider.start()) return;
  running = true; motionSamples = 0; $('start').disabled = true; $('stop').disabled = false; status('센서 추적 중 · 지도 이동은 출발 위치와 방향 보정 후 시작');
  setTimeout(() => { if (running && motionSamples === 0) status('동작 센서 값이 없습니다. 기기·브라우저 센서 권한을 확인하세요.'); }, 3000);
  setTimeout(() => { if (running && heading.last === null) status('방향 센서 값이 없습니다. 나침반 지원·권한을 확인하세요.'); }, 3500);
}
function stop() { if (provider.active) provider.stop(); running = false; $('start').disabled = false; $('stop').disabled = true; }
function reset() { stop(); detector.reset(); heading.reset(); pdr.reset(); navigation.reset(); selected = confirmed = match = route = null; uncertainHeading = true; lastStepHeading = null; $('source').textContent = '실제 센서 대기'; updateDashboard(); draw(); status('대기 · 지도에서 출발 위치를 선택하세요'); }

$('floor').addEventListener('change', loadFloor);
$('map').addEventListener('click', event => {
  if (!graph) return;
  const point = $('map').createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform($('map').getScreenCTM().inverse());
  if (measurePoints) {
    measurePoints.push({ x: mapped.x, y: mapped.y });
    if (measurePoints.length === 2) {
      const meters = Number($('measuredMeters').value), pixels = Math.hypot(measurePoints[1].x - measurePoints[0].x, measurePoints[1].y - measurePoints[0].y);
      if (meters > 0 && pixels > 0) { pixelsPerMeter = pixels / meters; scaleVerified = true; $('scaleStatus').textContent = `입력한 실측 기준 ${pixelsPerMeter.toFixed(2)} SVG/m · 두 지점과 거리의 정확도는 사용자 책임`; log('지도 거리 보정 완료'); }
      else status('실측 거리를 먼저 입력하세요');
      measurePoints = null;
    } else status('두 번째 지점을 지도에서 선택하세요');
    return;
  }
  stop(); selectPoint({ x: mapped.x, y: mapped.y });
});
$('confirm').addEventListener('click', confirmPoint);
$('route').addEventListener('click', drawRoute);
$('start').addEventListener('click', start);
$('homeStart').addEventListener('click', async () => {
  if (!graph || !selected) { status('지도를 불러오는 중입니다'); return; }
  if (!confirmed) confirmPoint();
  await start();
});
$('stop').addEventListener('click', () => { stop(); status('중지'); });
$('reset').addEventListener('click', reset);
$('measure').addEventListener('click', () => { measurePoints = []; status('지도에서 실측 거리의 시작점과 끝점을 선택하세요'); });
$('download').addEventListener('click', () => recorder.download());
$('saveResult').addEventListener('click', () => { const actual = Number($('actualMeters').value); recorder.add({ event: 'test-result', source, kind: $('testKind').value, actualDistanceM: $('actualMeters').value ? actual : null, detectedSteps: pdr.steps, estimatedDistanceM: pdr.distanceM, distanceErrorM: $('actualMeters').value ? pdr.distanceM - actual : null, actualTurnDegrees: $('actualTurn').value ? Number($('actualTurn').value) : null, sensorTurnDegrees: heading.rotation, headingUncertain: uncertainHeading }); status('시험 결과가 기록되었습니다'); });
$('simulate').addEventListener('click', () => {
  stop(); if (!confirmed) { status('모의 테스트도 출발 위치를 먼저 확정하세요'); return; }
  source = 'simulation'; $('source').textContent = '모의 센서 · 실제 센서 아님'; pdr.reset(confirmed); navigation.reset(); detector.reset();
  const first = mapHeading() ?? 0, base = Date.now();
  for (let i = 0; i < 16; i++) {
    const direction = i < 8 ? first : wrap(first + 90), at = base + i * 600;
    for (let t = 0; t <= 200; t += 50) {
      const sample = { x: t === 50 ? 5 : 0.1, y: 0, z: 0, timestamp: at + t };
      const outcome = detector.push(sample);
      recorder.add({ event: 'simulated-sensor', source: 'simulation', acceleration: sample, heading: direction, signal: outcome.signal });
      if (outcome.step) processStep(sample.timestamp, 'simulation', direction);
    }
  }
  status('모의 이동 완료 · 실제 센서 결과 아님');
});
['sensitivity', 'minInterval', 'maxInterval'].forEach(id => $(id).addEventListener('change', () => { detector.sensitivity = Number($('sensitivity').value) || 1; detector.minInterval = Number($('minInterval').value) || 300; detector.maxInterval = Number($('maxInterval').value) || 1200; }));
const support = SensorProvider.support(); $('sensorSupport').textContent = `동작 ${support.motion ? '지원' : '미지원'} · 방향 ${support.orientation ? '지원' : '미지원'} · ${support.secure ? '보안 연결' : 'HTTPS 필요'}`;
loadFloor();
