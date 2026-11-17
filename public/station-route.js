import { searchPlaces, shortestPath, fitAffine, project, validationError, insideCalibrationArea } from './station-route-math.js';
import { buildRouteSteps } from './route-steps.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const MAX_ACCURACY_M = 30;
let graph, anchors = [], training = [], fit = null;
let selected = { from: null, to: null }, route = null, steps = [], selectedStep = -1;
let watch = null, zoom = 1;

const svg = (tag, attributes) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

function routePoints(nodeIds) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  return nodeIds.map(id => `${nodes.get(id).x},${nodes.get(id).y}`).join(' ');
}

function drawRoute() {
  const layer = $('routeLayer');
  layer.replaceChildren();
  if (!route) return;
  const points = routePoints(route.ids);
  layer.append(
    svg('polyline', { points, fill: 'none', stroke: '#fff', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svg('polyline', { points, fill: 'none', stroke: '#e92758', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
  );
  if (selectedStep >= 0) {
    const segment = routePoints(steps[selectedStep].nodeIds);
    layer.append(
      svg('polyline', { points: segment, fill: 'none', stroke: '#fff', 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      svg('polyline', { points: segment, fill: 'none', stroke: '#1255a4', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-role': 'selected-step' })
    );
  }
  for (const [point, color, label] of [[route.points[0], '#1a73e8', '출발'], [route.points.at(-1), '#e92758', '도착']]) {
    layer.append(svg('circle', { cx: point.x, cy: point.y, r: 15, fill: color, stroke: '#fff', 'stroke-width': 5, 'aria-label': label }));
  }
}

function focusStep(step) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const points = step.nodeIds.map(id => nodes.get(id));
  const centerX = (Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2;
  const centerY = (Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2;
  requestAnimationFrame(() => {
    const scene = $('scene'), viewport = $('viewport');
    const scale = scene.clientWidth / graph.mapImage.width;
    viewport.scrollTo({
      left: Math.max(0, centerX * scale - viewport.clientWidth / 2),
      top: Math.max(0, centerY * scale - viewport.clientHeight / 2),
      behavior: 'smooth'
    });
  });
}

function selectStep(index) {
  if (index < 0 || index >= steps.length) return;
  selectedStep = index;
  drawRoute();
  for (const [cardIndex, card] of [...$('stepCards').children].entries()) {
    if (cardIndex === index) card.setAttribute('aria-current', 'step');
    else card.removeAttribute('aria-current');
  }
  $('guidePrev').disabled = index === 0;
  $('guideNext').disabled = index === steps.length - 1;
  $('guideProgress').textContent = `${index + 1} / ${steps.length}단계`;
  focusStep(steps[index]);
}

function clearRoute() {
  route = null;
  steps = [];
  selectedStep = -1;
  $('routeLayer').replaceChildren();
  $('stepCards').replaceChildren();
  $('routeSummary').hidden = true;
  $('routeDetails').hidden = true;
  $('guideControls').hidden = true;
  $('guideProgress').textContent = '단계를 선택하세요';
  $('guidePrev').disabled = true;
  $('guideNext').disabled = true;
  $('routeStatus').textContent = '출발지와 목적지를 검색해 선택하세요.';
}

function renderRoute() {
  clearRoute();
  const from = selected.from, to = selected.to;
  if (!from || !to) return;
  route = shortestPath(graph, from.nodeId, to.nodeId);
  if (!route) {
    $('routeStatus').textContent = '두 시설을 연결하는 경로가 없습니다.';
    return;
  }
  steps = buildRouteSteps(graph, route, from, to);
  $('routeSummaryText').textContent = `${from.name} → ${to.name}`;
  $('routeSummary').hidden = false;
  $('stepCount').textContent = `총 ${steps.length}단계`;
  const cards = steps.map(step => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step-card';
    button.dataset.nodeIds = step.nodeIds.join(',');
    const number = document.createElement('span');
    number.className = 'step-number';
    number.textContent = step.number;
    const text = document.createElement('span');
    text.className = 'step-text';
    text.textContent = step.text;
    button.append(number, text);
    button.addEventListener('click', () => selectStep(step.number - 1));
    return button;
  });
  $('stepCards').replaceChildren(...cards);
  $('routeDetails').hidden = false;
  $('guideControls').hidden = false;
  $('routeStatus').textContent = '경로가 표시되었습니다. 아래에서 단계를 확인하세요.';
  drawRoute();
}

function setupSearch(key) {
  const input = $(key), box = $(`${key}Results`);
  const showMatches = () => {
    const matches = searchPlaces(graph.places, input.value).slice(0, 15);
    box.replaceChildren();
    for (const place of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = !place.nodeId;
      button.append(document.createTextNode(place.name));
      if (!place.nodeId) {
        const small = document.createElement('small');
        small.textContent = '경로 연결 전';
        button.append(small);
      }
      button.addEventListener('click', () => {
        selected[key] = place;
        input.value = place.name;
        box.replaceChildren();
        clearRoute();
      });
      box.append(button);
    }
    if (input.value && !matches.length) box.textContent = '검색 결과가 없습니다.';
  };
  input.addEventListener('input', () => {
    selected[key] = null;
    clearRoute();
    showMatches();
  });
  input.addEventListener('focus', showMatches);
}

function gpsPoint(position) {
  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  $('lat').textContent = lat.toFixed(7);
  $('lng').textContent = lng.toFixed(7);
  $('accuracy').textContent = `±${Math.round(accuracy)} m`;
  $('updated').textContent = new Date(position.timestamp).toLocaleString('ko-KR');
  const layer = $('gpsLayer');
  layer.replaceChildren();
  if (!fit) { $('gpsStatus').textContent = '수신 중 · 지도 좌표 보정 필요'; return; }
  if (accuracy > MAX_ACCURACY_M) { $('gpsStatus').textContent = `수신 중 · 정확도 기준 초과 (${MAX_ACCURACY_M} m)`; return; }
  if (!insideCalibrationArea(training, lat, lng)) { $('gpsStatus').textContent = '수신 중 · 보정 영역 밖'; return; }
  const [x, y] = project(fit, lat, lng);
  if (x < 0 || x > 2048 || y < 0 || y > 1386) { $('gpsStatus').textContent = '수신 중 · 지도 범위 밖'; return; }
  layer.append(
    svg('circle', { cx: x, cy: y, r: 20, fill: '#1a73e855', stroke: '#1a73e8', 'stroke-width': 3 }),
    svg('circle', { cx: x, cy: y, r: 8, fill: '#1a73e8', stroke: '#fff', 'stroke-width': 3 })
  );
  $('gpsStatus').textContent = '수신 중 · 3층 보정 좌표 표시';
}

function gpsError(error) {
  $('gpsLayer').replaceChildren();
  $('gpsStatus').textContent = error.code === 1 ? '위치 권한 거부' : error.code === 3 ? '위치 수신 시간 초과' : '위치 수신 실패';
}

function stopGps() {
  if (watch !== null) { navigator.geolocation.clearWatch(watch); watch = null; }
  $('gpsOn').disabled = false;
  $('gpsOff').disabled = true;
  $('gpsLayer').replaceChildren();
  $('gpsStatus').textContent = '꺼짐';
}

async function init() {
  try {
    const [graphResponse, anchorResponse] = await Promise.all([fetch('/daejeon-station-3f-graph.json'), fetch('/gps-anchors.json')]);
    if (!graphResponse.ok || !anchorResponse.ok) throw Error('데이터 파일을 읽을 수 없습니다.');
    graph = await graphResponse.json();
    const all = await anchorResponse.json();
    anchors = all.filter(value => Number(value.floor) === 3 && ['lat', 'lng', 'x', 'y'].every(key => Number.isFinite(Number(value[key]))))
      .map(value => ({ ...value, lat: Number(value.lat), lng: Number(value.lng), x: Number(value.x), y: Number(value.y) }));
    training = anchors.filter(value => value.role !== 'validation');
    fit = fitAffine(training);
    $('calibration').textContent = fit ? `3층 기준점 ${training.length}개 · 아핀 보정 적용` : '지도 좌표 보정 필요 (비공선 기준점 3개 이상)';
    const checks = anchors.filter(value => value.role === 'validation');
    const errors = checks.map(check => validationError(training, check)).filter(Number.isFinite);
    $('validation').textContent = errors.length ? `${Math.max(...errors).toFixed(1)} px (최대, ${errors.length}점)` : '별도 검증점 없음';
    if (!fit && training.length >= 3) $('calibration').textContent = '기준점이 공선 또는 중복 · 보정 불가';
    setupSearch('from');
    setupSearch('to');
    $('route').addEventListener('click', renderRoute);
    $('routeStatus').textContent = '시설을 검색해 선택하세요.';
  } catch (error) {
    $('routeStatus').textContent = `초기화 실패: ${error.message}`;
    $('calibration').textContent = '파일 로딩 실패';
  }
}

$('gpsOn').addEventListener('click', () => {
  if (!navigator.geolocation) { $('gpsStatus').textContent = '브라우저 위치 기능 없음'; return; }
  if (!window.isSecureContext) { $('gpsStatus').textContent = 'HTTPS 또는 localhost에서 접속하세요'; return; }
  $('gpsStatus').textContent = '위치 권한 및 수신 대기';
  $('gpsOn').disabled = true;
  $('gpsOff').disabled = false;
  watch = navigator.geolocation.watchPosition(gpsPoint, gpsError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
});
$('gpsOff').addEventListener('click', stopGps);
$('guideStart').addEventListener('click', () => selectStep(0));
$('guidePrev').addEventListener('click', () => selectStep(selectedStep - 1));
$('guideNext').addEventListener('click', () => selectStep(selectedStep + 1));

function setZoom(next) {
  zoom = Math.max(1, Math.min(4, next));
  $('scene').style.width = `${zoom * 100}%`;
}
$('zoomIn').addEventListener('click', () => setZoom(zoom * 1.3));
$('zoomOut').addEventListener('click', () => setZoom(zoom / 1.3));
$('zoomReset').addEventListener('click', () => setZoom(1));
init();
