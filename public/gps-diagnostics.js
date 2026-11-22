import { calibration, candidatePreview, validPosition, smoothPosition, matchEdge } from './gps-location.js';
import { project } from './station-route-math.js';
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const base = '/assets/daejeon_marked_plans_and_coordinates/';
let lastMapPoint = null;
let settings, points, graph, watch = null, latest = null, smoothed = null, source = null, timer = null, zoom = 1, rotation = 0, previousMatch = null, rejected = 0;
const element = (tag, attrs) => { const node = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v)); return node; };
const current = () => settings.floors.find(f => f.floor === Number($('floor').value));
const status = message => { $('gpsStatus').textContent = message; };
function refreshMap() {
  const f = current(), [x, y, w, h] = f.viewBox;
  $('map').setAttribute('viewBox', f.viewBox.join(' '));
  $('floorImage').setAttribute('href', `${base}floor_${f.floor}_marked.svg`);
  for (const [key, value] of Object.entries({ x, y, width: w, height: h })) $('floorImage').setAttribute(key, value);
  $('mapId').textContent = f.mapId;
  const result = calibration(f);
  $('calibration').textContent = `${result.status} · 기준점 ${result.anchors.length}개`;
  $('validation').textContent = result.errors.length ? `${Math.max(...result.errors).toFixed(1)} SVG 단위 (최대)` : '독립 검증점 없음';
  $('pointCount').textContent = `도면 지점 ${points.filter(p => p.floor === f.floor).length}개 · 경로 노드와 별도`;
  $('gpsLayer').replaceChildren();
  lastMapPoint = null;
  previousMatch = null;
  if (latest) display(latest);
}
function display(position) {
  const error = validPosition(position);
  const { latitude, longitude, accuracy } = position.coords;
  $('lat').textContent = Number.isFinite(latitude) ? latitude.toFixed(7) : '—';
  $('lng').textContent = Number.isFinite(longitude) ? longitude.toFixed(7) : '—';
  $('accuracy').textContent = Number.isFinite(accuracy) ? `±${Math.round(accuracy)} m` : '—';
  $('updated').textContent = new Date(position.timestamp).toLocaleString('ko-KR');
  $('source').textContent = source === 'mock' ? '모의 위치' : '실제 GPS';
  $('gpsLayer').replaceChildren();
  if (error) { lastMapPoint = null; status(error); return; }
  const f = current(), result = calibration(f);
  const validated = f.status === 'validated' && result.fit && result.errors.length;
  const preview = !validated && $('experimental').checked;
  const fit = validated ? result.fit : preview ? candidatePreview(points, f.floor) : null;
  if (!fit) { lastMapPoint = null; status(`${source === 'mock' ? '모의 위치 · ' : ''}GPS 정합 미완료 · 미검증 미리보기를 켜면 추정 위치를 볼 수 있습니다`); return; }
  const [x, y] = project(fit, latitude, longitude);
  const [, , w, h] = f.viewBox;
  if (x < 0 || x > w || y < 0 || y > h) { lastMapPoint = null; status('지도 범위 밖'); return; }
  const [a, b, , d, e] = fit.p;
  const determinant = a * e - b * d;
  if (Math.abs(determinant) < 1e-10) { lastMapPoint = null; status('보정 행렬 오류'); return; }
  const firstPoint = !lastMapPoint;
  lastMapPoint = { x, y, width: w, height: h };
  const layer = $('gpsLayer');
  layer.append(element('circle', { cx: 0, cy: 0, r: accuracy, transform: `matrix(${a} ${d} ${b} ${e} ${x} ${y})`, fill: '#1a73e844', stroke: '#1a73e8', 'stroke-width': 2 / Math.sqrt(Math.abs(determinant)) }));
  layer.append(element('circle', { cx: x, cy: y, r: 8, fill: '#1a73e8', stroke: '#fff', 'stroke-width': 3 }));
  if (preview) { const label = element('text', { x: x + 12, y: y - 12, fill: '#a52714', 'font-size': 20, 'font-weight': 800 }); label.textContent = '추정 위치 · 미검증'; layer.append(label); }
  status(`${source === 'mock' ? '모의 위치 · ' : '실시간 GPS · '}${preview ? '추정 위치 (미검증)' : '검증 지도 위치'} · ±${Math.round(accuracy)} m · ${new Date(position.timestamp).toLocaleTimeString('ko-KR')}`);
  if (firstPoint && source === 'gps') $('gpsCenter').click();
  // 후보 그래프는 현장 검증 전이므로 통로 위치를 안내 경로로 확정하지 않는다.
  if (!preview && graph?.routableForPublicUse === true && graph.mapImage.fileName === f.mapId) {
    const match = matchEdge(graph, { x, y }, Math.max(10, accuracy * Math.max(Math.hypot(a, d), Math.hypot(b, e))), previousMatch);
    if (match) { previousMatch = match; layer.append(element('circle', { cx: match.x, cy: match.y, r: 6, fill: '#f48726' })); $('matching').textContent = `${match.edge.id} · 진행률 ${(match.t * 100).toFixed(0)}%`; }
    else $('matching').textContent = '통로 후보가 불분명함';
  } else $('matching').textContent = '미검증 그래프 · 안내 연결 보류';
}
function receive(position, kind) {
  if (source !== kind) { smoothed = null; previousMatch = null; }
  source = kind;
  latest = position;
  if (!validPosition(position)) {
    const next = smoothPosition(smoothed, position);
    if (next === smoothed && ++rejected < 3) {
      display(smoothed);
      return;
    }
    rejected = 0;
    smoothed = next === smoothed ? position : next;
  }
  display(smoothed || position);
}
function stop() {
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  watch = null;
  $('gpsOn').disabled = false; $('gpsOff').disabled = true;
  if (timer) clearInterval(timer); timer = null;
}
function start() {
  stop();
  if (!navigator.geolocation || !window.isSecureContext) { status('HTTPS 또는 localhost의 위치 기능이 필요합니다'); return; }
  source = 'gps'; latest = smoothed = null; rejected = 0;
  status('위치 권한 및 수신 대기');
  $('gpsOn').disabled = true; $('gpsOff').disabled = false;
  watch = navigator.geolocation.watchPosition(p => { $('permission').textContent = '허용'; receive(p, 'gps'); }, error => { $('permission').textContent = error.code === 1 ? '거부' : '확인 필요'; status(error.code === 1 ? '위치 권한 거부' : error.code === 3 ? '위치 수신 시간 초과' : '위치 수신 실패'); if (error.code === 1) { $('gpsLayer').replaceChildren(); stop(); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}
$('gpsOn').addEventListener('click', start);
$('gpsRetry').addEventListener('click', start);
$('gpsCenter').addEventListener('click', () => {
  if (!lastMapPoint) return;
  const viewport = $('viewport'), scene = $('scene');
  const { x, y, width, height } = lastMapPoint;
  viewport.scrollTo?.({ left: Math.max(0, x / width * scene.clientWidth - viewport.clientWidth / 2), top: Math.max(0, y / height * scene.clientHeight - viewport.clientHeight / 2), behavior: 'smooth' });
});
$('gpsOff').addEventListener('click', () => { stop(); lastMapPoint = null; status('꺼짐'); $('gpsLayer').replaceChildren(); });
$('experimental').addEventListener('change', () => { if (latest) display(latest); });
$('floor').addEventListener('change', () => { latest = smoothed = null; source = null; refreshMap(); status('층 변경 · 새 위치 대기'); });
$('mockApply').addEventListener('click', () => {
  stop();
  const latitude = Number($('mockLat').value), longitude = Number($('mockLng').value), accuracy = Number($('mockAccuracy').value);
  if (!$('mockLat').value || !$('mockLng').value || !$('mockAccuracy').value) { status('모의 좌표를 입력하세요'); return; }
  receive({ coords: { latitude, longitude, accuracy }, timestamp: Date.now() }, 'mock');
});
$('replayStart').addEventListener('click', () => {
  let records;
  try { records = JSON.parse($('replay').value); if (!Array.isArray(records) || !records.length) throw Error(); } catch { status('모의 기록 JSON 배열이 필요합니다'); return; }
  stop(); source = null; smoothed = null;
  let i = 0;
  const play = () => { if (i >= records.length) { clearInterval(timer); timer = null; return; } const r = records[i++]; receive({ coords: { latitude: Number(r.latitude), longitude: Number(r.longitude), accuracy: Number(r.accuracy) }, timestamp: r.timestamp ? Number(r.timestamp) : Date.now() }, 'mock'); };
  play(); timer = setInterval(play, 1000);
});
$('anchorAdd').addEventListener('click', () => {
  const f = current(), anchor = { id: $('anchorId').value.trim(), lat: Number($('anchorLat').value), lng: Number($('anchorLng').value), x: Number($('anchorX').value), y: Number($('anchorY').value), role: $('anchorRole').value, verified: true };
  if (!anchor.id || ['anchorLat', 'anchorLng', 'anchorX', 'anchorY'].some(id => !$(id).value) || ![anchor.lat, anchor.lng, anchor.x, anchor.y].every(Number.isFinite) || Math.abs(anchor.lat) > 90 || Math.abs(anchor.lng) > 180 || f.anchors.some(a => a.id === anchor.id)) { $('anchorStatus').textContent = '고유 ID와 유효한 좌표를 입력하세요'; return; }
  f.anchors.push(anchor); $('anchorStatus').textContent = `${f.floor}층 기준점 ${f.anchors.length}개`; refreshMap();
});
$('anchorExport').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'gps-calibration.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
for (const [id, factor] of [['zoomIn', 1.3], ['zoomOut', 1 / 1.3]]) $(id).addEventListener('click', () => { zoom = Math.max(1, Math.min(4, zoom * factor)); $('scene').style.width = `${zoom * 100}%`; });
$('rotate').addEventListener('click', () => { rotation = (rotation + 90) % 360; $('map').style.transform = `rotate(${rotation}deg)`; });
$('zoomReset').addEventListener('click', () => { zoom = 1; rotation = 0; $('scene').style.width = '100%'; $('map').style.transform = ''; });
window.addEventListener('pagehide', stop);
setInterval(() => { if (latest && source === 'gps' && Date.now() - latest.timestamp > 15000) { $('gpsLayer').replaceChildren(); lastMapPoint = null; status('위치 갱신 중단 · 오래된 위치'); } }, 1000);
try {
  const responses = await Promise.all(['/gps-calibration.json', '/gps-points.json', '/assets/json/floor-3-graph.json'].map(path => fetch(path)));
  if (responses.some(r => !r.ok)) throw Error('지도 데이터를 읽을 수 없습니다');
  [settings, { points }, graph] = await Promise.all(responses.map(r => r.json()));
  refreshMap();
} catch (error) { status(`초기화 실패: ${error.message}`); }
