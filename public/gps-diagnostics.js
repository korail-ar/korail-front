import { fitAffine, project, validationError, insideCalibrationArea } from './station-route-math.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const MAX_ACCURACY_M = 30;
let training = [], fit = null, watch = null;

const svg = (tag, attributes) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

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

$('gpsOn').addEventListener('click', () => {
  if (!navigator.geolocation) { $('gpsStatus').textContent = '브라우저 위치 기능 없음'; return; }
  if (!window.isSecureContext) { $('gpsStatus').textContent = 'HTTPS 또는 localhost에서 접속하세요'; return; }
  $('gpsStatus').textContent = '위치 권한 및 수신 대기';
  $('gpsOn').disabled = true;
  $('gpsOff').disabled = false;
  watch = navigator.geolocation.watchPosition(gpsPoint, gpsError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
});
$('gpsOff').addEventListener('click', stopGps);
window.addEventListener('pagehide', stopGps);

try {
  const response = await fetch('/gps-anchors.json');
  if (!response.ok) throw Error('기준점 파일을 읽을 수 없습니다.');
  const all = await response.json();
  const anchors = all.filter(value => Number(value.floor) === 3 && ['lat', 'lng', 'x', 'y'].every(key => Number.isFinite(Number(value[key]))))
    .map(value => ({ ...value, lat: Number(value.lat), lng: Number(value.lng), x: Number(value.x), y: Number(value.y) }));
  training = anchors.filter(value => value.role !== 'validation');
  fit = fitAffine(training);
  $('calibration').textContent = fit ? `3층 기준점 ${training.length}개 · 아핀 보정 적용` : '지도 좌표 보정 필요 (비공선 기준점 3개 이상)';
  const checks = anchors.filter(value => value.role === 'validation');
  const errors = checks.map(check => validationError(training, check)).filter(Number.isFinite);
  $('validation').textContent = errors.length ? `${Math.max(...errors).toFixed(1)} px (최대, ${errors.length}점)` : '별도 검증점 없음';
  if (!fit && training.length >= 3) $('calibration').textContent = '기준점이 공선 또는 중복 · 보정 불가';
} catch (error) {
  $('calibration').textContent = `파일 로딩 실패: ${error.message}`;
}
