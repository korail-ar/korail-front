/** @typedef {{latitude:number,longitude:number,accuracy:number,heading:number|null,speed:number|null,timestamp:number}} LocationSample */
/** A provider calls onSample(LocationSample) and onError(Error), and returns a stop function. External Wi-Fi positioning can implement this contract later. */
export function browserLocationProvider(geolocation = navigator.geolocation) {
  return {
    subscribe(onSample, onError) {
      if (!globalThis.isSecureContext) throw Error('HTTPS 또는 localhost에서 위치 측정을 여세요.');
      if (!geolocation?.watchPosition) throw Error('이 브라우저는 위치 측정을 지원하지 않습니다.');
      const id = geolocation.watchPosition(position => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        onSample({ latitude, longitude, accuracy, heading: Number.isFinite(heading) ? heading : null, speed: Number.isFinite(speed) ? speed : null, timestamp: position.timestamp });
      }, onError, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
      return () => geolocation.clearWatch(id);
    }
  };
}
