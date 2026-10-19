import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Store only tiny state samples, never a queue of uncompressed video frames.
export class VideoOutput {
  constructor(switcher, log) {
    this.switcher = switcher; this.status = process.platform === 'win32' ? 'detenida' : 'solo vista previa (webcam disponible en Windows)';
    this.log = log; this.samples = []; this.child = null;
  }
  start() {
    if (process.platform !== 'win32' || this.child) return;
    const executable = fileURLToPath(new URL('../native/camera-windows.exe', import.meta.url));
    const child = spawn(executable, [], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
    this.child = child; this.status = 'iniciando';
    child.stderr.setEncoding('utf8'); let pending = '';
    child.stderr.on('data', data => {
      pending += data;
      const lines = pending.split('\n'); pending = lines.pop();
      for (const line of lines) { this.status = line.trim(); this.log(`Webcam: ${this.status}`); }
    });
    child.on('error', e => { clearInterval(this.timer); this.child = null; this.status = `no disponible: ${e.message}`; this.log(this.status); });
    child.stdin.on('error', e => { this.log(`Webcam: ${e.message}`); });
    child.on('exit', () => { clearInterval(this.timer); this.child = null; this.status = 'detenida'; });
    this.timer = setInterval(() => {
      if (child.stdin.destroyed) return;
      const line = this.sample();
      // No unbounded pipe queue when the native sender or receiver is slow.
      if (line && child.stdin.writableLength < 4096) child.stdin.write(line);
    }, 1000 / this.switcher.fps);
  }
  sample() {
    const current = this.switcher.snapshot();
    if (this.resolution !== current.resolution) {
      // Old-sized frames must never reappear after applying a new format.
      this.samples = []; this.resolution = current.resolution;
    }
    this.samples.push(current);
    const count = current.latencyFrames + 1;
    if (this.samples.length < count) return null;
    while (this.samples.length > count) this.samples.shift();
    const s = this.samples[0];
    return `${s.program} ${s.preview} ${s.mix.toFixed(5)} ${s.width} ${s.height}\n`;
  }
  async close() {
    clearInterval(this.timer);
    const child = this.child;
    if (!child) return;
    await new Promise(resolve => {
      const timeout = setTimeout(() => { child.kill(); resolve(); }, 1500);
      child.once('exit', () => { clearTimeout(timeout); resolve(); });
      child.stdin.end();
    });
  }
}
