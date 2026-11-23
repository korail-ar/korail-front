export class SensorProvider {
  constructor({ onMotion, onOrientation, onStatus }) { Object.assign(this, { onMotion, onOrientation, onStatus }); this.active = false; }
  static support() { return { motion: 'DeviceMotionEvent' in window, orientation: 'DeviceOrientationEvent' in window, secure: window.isSecureContext }; }
  async start() {
    const support = SensorProvider.support();
    if (!support.secure || !support.motion || !support.orientation) { this.onStatus('센서 미지원 또는 HTTPS 필요'); return false; }
    try {
      for (const kind of [DeviceMotionEvent, DeviceOrientationEvent]) {
        if (typeof kind.requestPermission === 'function' && await kind.requestPermission() !== 'granted') { this.onStatus('센서 권한 거부'); return false; }
      }
    } catch (error) { this.onStatus(`센서 권한 오류: ${error.message}`); return false; }
    this.motionListener = event => this.onMotion(event);
    this.orientationListener = event => this.onOrientation(event);
    window.addEventListener('devicemotion', this.motionListener);
    window.addEventListener('deviceorientation', this.orientationListener);
    this.active = true; this.onStatus('센서 수신 대기'); return true;
  }
  stop() { if (this.motionListener) window.removeEventListener('devicemotion', this.motionListener); if (this.orientationListener) window.removeEventListener('deviceorientation', this.orientationListener); this.active = false; this.onStatus('중지'); }
}
