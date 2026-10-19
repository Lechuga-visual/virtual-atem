import { EventEmitter } from 'node:events';
import { performance } from 'node:perf_hooks';

export class Switcher extends EventEmitter {
  constructor() {
    super();
    this.program = 1;
    this.preview = 2;
    this.rate = 30;
    this.fps = 30;
    this.latencyFrames = 2;
    this.resolution = '1280x720';
    this.transition = null;
    this.timer = null;
  }
  snapshot(now = performance.now()) {
    const t = this.transition;
    const progress = t ? Math.min(1, (now - t.start) / t.duration) : 0;
    const [width, height] = this.resolution.split('x').map(Number);
    return { resolution: this.resolution, width, height, program: this.program, preview: this.preview, rate: this.rate, fps: this.fps,
      latencyFrames: this.latencyFrames, inTransition: !!t,
      remainingFrames: t ? Math.max(0, Math.ceil((1 - progress) * t.frames)) : 0,
      position: Math.round(progress * 10000), mix: progress };
  }
  notify() { this.emit('change', this.snapshot()); }
  select(bus, input) {
    if (!['program', 'preview'].includes(bus) || !Number.isInteger(input) || input < 1 || input > 4) throw new Error('Entrada válida: 1–4');
    if (this.transition) throw new Error('Espera a que termine AUTO');
    this[bus] = input;
    this.notify();
  }
  configure({ rate = this.rate, latencyFrames = this.latencyFrames, resolution = this.resolution } = {}) {
    if (!Number.isInteger(rate) || rate < 1 || rate > 250 || !Number.isInteger(latencyFrames) || latencyFrames < 0 || latencyFrames > 120) throw new Error('Duración: 1–250; latencia: 0–120 fotogramas');
    if (!['1280x720', '1920x1080'].includes(resolution)) throw new Error('Resolución válida: 1280x720 o 1920x1080');
    if (this.transition) throw new Error('Espera a que termine AUTO');
    this.resolution = resolution;
    this.rate = rate; this.latencyFrames = latencyFrames; this.notify();
  }
  cut() {
    if (this.transition) throw new Error('Espera a que termine AUTO');
    [this.program, this.preview] = [this.preview, this.program];
    this.notify();
  }
  auto() {
    if (this.transition) throw new Error('AUTO ya está en curso');
    this.transition = { start: performance.now(), duration: this.rate * 1000 / this.fps, frames: this.rate };
    this.notify();
    this.timer = setInterval(() => {
      if (this.snapshot().mix >= 1) {
        clearInterval(this.timer); this.timer = null; this.transition = null;
        [this.program, this.preview] = [this.preview, this.program];
      }
      this.notify();
    }, 1000 / this.fps);
  }
  close() { clearInterval(this.timer); this.timer = null; }
}
