import dgram from 'node:dgram';
import { randomInt } from 'node:crypto';
import { packet, parseCommands, stateCommands, initialCommands, covered, MOD } from './protocol.js';

export class AtemServer {
  constructor(switcher, { host = '127.0.0.1', port = 9910, log = () => {} } = {}) {
    this.switcher = switcher; this.host = host; this.port = port; this.log = log;
    this.sessions = new Map(); this.socket = dgram.createSocket('udp4');
    this.socket.on('message', (b, r) => { try { this.receive(b, r); } catch (e) { this.log(`Paquete descartado: ${e.message}`); } });
    this.socket.on('error', e => this.log(`UDP: ${e.message}`));
    this.onChange = s => { const payload = Buffer.concat(stateCommands(s)); for (const c of this.sessions.values()) if (c.ready) this.send(c, payload); };
    switcher.on('change', this.onChange);
  }
  async listen() {
    await new Promise((resolve, reject) => { this.socket.once('error', reject); this.socket.bind(this.port, this.host, () => { this.socket.removeListener('error', reject); resolve(); }); });
    this.port = this.socket.address().port;
    this.timer = setInterval(() => this.tick(), 50);
  }
  raw(c, b) { this.socket.send(b, c.port, c.address); }
  send(c, payload = Buffer.alloc(0)) {
    if (c.pending.size >= 256) { this.sessions.delete(c.key); this.log('Cliente sin confirmaciones desconectado'); return; }
    const id = c.next; c.next = (id + 1) % MOD;
    const b = packet(1, c.id, id, payload);
    c.pending.set(id, { b, time: Date.now(), retries: 0 }); this.raw(c, b); c.lastSend = Date.now();
  }
  ack(c) { this.raw(c, packet(16, c.id, 0, undefined, c.received)); }
  receive(b, r) {
    if (b.length < 12 || b.length > 2047 || (b.readUInt16BE(0) & 2047) !== b.length) return;
    const flags = b[0] >> 3, key = `${r.address}:${r.port}`;
    if (flags & 2) {
      if (b.length !== 20 || b[12] !== 1) return;
      const old = this.sessions.get(key);
      if (old && !old.ready) { this.raw(old, old.hello); return; }
      if (!old && this.sessions.size >= 16) return;
      const c = { key, address: r.address, port: r.port, id: randomInt(1, 65536), next: 1, received: 0,
        pending: new Map(), buffered: new Map(), ready: false, seen: Date.now(), lastSend: Date.now() };
      c.hello = packet(2, c.id, 0, Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]));
      this.sessions.set(key, c); this.raw(c, c.hello); this.log(`Cliente ATEM: ${r.address}`); return;
    }
    const c = this.sessions.get(key);
    if (!c || b.readUInt16BE(2) !== c.id) return;
    c.seen = Date.now();
    if (flags & 16) {
      const ack = b.readUInt16BE(4);
      if (ack >= MOD) return;
      if (!c.ready && ack === 0) { c.ready = true; this.send(c, Buffer.concat(initialCommands(this.switcher.snapshot()))); }
      else for (const id of c.pending.keys()) if (covered(ack, id)) c.pending.delete(id);
    }
    if (flags & 8) {
      const from = b.readUInt16BE(6) % MOD;
      for (const [id, item] of c.pending) if (id === from || !covered(from, id)) this.resend(c, item);
    }
    if (flags & 1 && c.ready) {
      const id = b.readUInt16BE(10);
      if (id >= MOD) return;
      const distance = (id - c.received + MOD) % MOD;
      if (distance === 1) {
        this.apply(b.subarray(12)); c.received = id;
        while (c.buffered.has((c.received + 1) % MOD)) {
          const next = (c.received + 1) % MOD, payload = c.buffered.get(next);
          c.buffered.delete(next); this.apply(payload); c.received = next;
        }
        this.ack(c);
      } else if (distance > 1 && distance <= 256) {
        c.buffered.set(id, b.subarray(12)); this.raw(c, packet(8, c.id, 0, undefined, 0, (c.received + 1) % MOD));
      } else if (covered(c.received, id)) this.ack(c);
    }
  }
  apply(payload) {
    for (const { name, data } of parseCommands(payload)) {
      try {
        if (['CPgI', 'CPvI'].includes(name) && data.length >= 4 && data[0] === 0) this.switcher.select(name === 'CPgI' ? 'program' : 'preview', data.readUInt16BE(2));
        else if (name === 'DCut' && data.length >= 1 && data[0] === 0) this.switcher.cut();
        else if (name === 'DAut' && data.length >= 1 && data[0] === 0) this.switcher.auto();
        else if (name === 'CTMx' && data.length >= 2 && data[0] === 0) this.switcher.configure({ rate: data[1] });
        else { this.log(`Comando no implementado: ${name}`); continue; }
        this.log(`ATEM ${name}`);
      } catch (e) { this.log(`${name}: ${e.message}`); }
    }
  }
  resend(c, item) {
    const b = Buffer.from(item.b); b[0] |= 4 << 3; this.raw(c, b); item.time = Date.now(); item.retries++;
  }
  tick() {
    const now = Date.now();
    for (const [key, c] of this.sessions) {
      if (now - c.seen > 10000) { this.sessions.delete(key); continue; }
      if (!c.ready) { if (now - c.lastSend > 500) { this.raw(c, c.hello); c.lastSend = now; } continue; }
      for (const item of c.pending.values()) if (now - item.time >= 100) {
        if (item.retries >= 20) { this.sessions.delete(key); break; }
        this.resend(c, item);
      }
      if (this.sessions.has(key) && now - c.lastSend >= 1000) this.send(c);
    }
  }
  async close() {
    clearInterval(this.timer); this.switcher.off('change', this.onChange);
    await new Promise(resolve => { try { this.socket.close(resolve); } catch { resolve(); } });
  }
}
