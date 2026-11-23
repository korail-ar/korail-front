export class SensorProvider {
  constructor({ onMotion, onOrientation, onStatus }) { Object.assign(this, { onMotion, onOrientation, onStatus }); this.active = false; }
  static support() { return { motion: 'DeviceMotionEvent' in window, orientation: 'DeviceOrientationEvent' in window, secure: window.isSecureContext }; }
  async start() {
    const support = SensorProvider.support();
    if (!support.secure || !support.motion || !support.orientation) { this.onStatus('센서 미지원 또는 HTTPS 필요'); return false; }
    try {
      // Start both requests in the same click activation; awaiting the first can
      // consume Safari's user gesture before the second request is made.
      const permissions = [DeviceMotionEvent, DeviceOrientationEvent]
        .filter(kind => typeof kind.requestPermission === 'function')
        .map(kind => kind.requestPermission());
      if ((await Promise.all(permissions)).some(permission => permission !== 'granted')) { this.onStatus('센서 권한 거부'); return false; }
    } catch (error) { this.onStatus(`센서 권한 오류: ${error.message}`); return false; }
    this.motionListener = event => this.onMotion(event);
    this.orientationListener = event => this.onOrientation(event);
    window.addEventListener('devicemotion', this.motionListener);
    window.addEventListener('deviceorientation', this.orientationListener);
    this.active = true; this.onStatus('센서 수신 대기'); return true;
  }
  stop() { if (this.motionListener) window.removeEventListener('devicemotion', this.motionListener); if (this.orientationListener) window.removeEventListener('deviceorientation', this.orientationListener); this.active = false; this.onStatus('중지'); }
}
