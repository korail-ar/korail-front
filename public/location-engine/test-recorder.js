export class TestRecorder {
  constructor() { this.rows = []; }
  add(row) { this.rows.push({ timestamp: Date.now(), ...row }); if (this.rows.length > 30000) this.rows.shift(); }
  download() {
    const blob = new Blob([JSON.stringify({ type: 'PDR experiment', exportedAt: new Date().toISOString(), rows: this.rows }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `pdr-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
