import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { Atem } from 'atem-connection';
import { Switcher } from '../src/switcher.js';
import { AtemServer } from '../src/atem-server.js';
import { createApp } from '../src/server.js';

async function until(fn, timeout = 3000) {
  const end = Date.now() + timeout;
  while (!fn()) { if (Date.now() > end) throw new Error('Estado esperado no recibido'); await delay(10); }
}

test('atem-connection 3.10.3: handshake, four inputs, commands, AUTO, multiple clients, reconnect', { timeout: 15000 }, async t => {
  const sw = new Switcher(), logs = [];
  const server = new AtemServer(sw, { port: 0, log: s => logs.push(s) });
  await server.listen(); const clients = [];
  t.after(async () => { for (const c of clients) await c.destroy(); sw.close(); await server.close(); });
  async function connect() {
    const c = new Atem({ disableMultithreaded: true }); clients.push(c);
    c.on('error', e => assert.fail(String(e)));
    const ready = once(c, 'connected', { signal: AbortSignal.timeout(3000) });
    await c.connect('127.0.0.1', server.port); await ready; return c;
  }
  const a = await connect(), b = await connect();
  const me = c => c.state.video.mixEffects[0];
  assert.equal(a.state.info.model, 13);
  assert.equal(Object.keys(a.state.inputs).length, 4);
  assert.equal(me(a).programInput, 1); assert.equal(me(a).previewInput, 2);
  await a.changeProgramInput(3); await until(() => me(b).programInput === 3);
  await a.changePreviewInput(4); await until(() => me(b).previewInput === 4);
  await a.cut(); await until(() => me(b).programInput === 4 && me(b).previewInput === 3);
  sw.select('program', 2); await until(() => me(a).programInput === 2);
  await a.setMixTransitionSettings({ rate: 6 }); await until(() => sw.rate === 6);
  const programs = []; a.on('stateChanged', () => programs.push(me(a).programInput));
  await a.autoTransition();
  await until(() => me(a).transitionPosition.inTransition);
  assert.equal(sw.program, 2, 'program remains on outgoing input until transition completes');
  await until(() => me(a).programInput === 3 && me(a).previewInput === 2);
  assert.equal(me(a).transitionPosition.inTransition, false);
  assert.ok(programs.includes(3));
  server.sessions.clear();
  const reconnect = once(a, 'connected', { signal: AbortSignal.timeout(8000) }); await reconnect;
  assert.equal(me(a).programInput, 3);
  assert.ok(!logs.some(s => s.includes('descartado')), logs.join('\n'));
});

test('local panel changes actual ATEM state and rejects cross-origin requests', async t => {
  const app = await createApp({ port: 0, udpPort: 0, udpHost: '127.0.0.1', camera: false });
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.port}`;
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + '/api/status')).status, 403);
  const { token } = await (await fetch(base + '/api/session')).json();
  async function action(body, extra = {}) { return fetch(base + '/api/action', { method: 'POST', headers: { 'x-session-token': token, ...extra }, body: JSON.stringify(body) }); }
  assert.equal((await action({ type: 'program', input: 4 })).status, 200);
  assert.equal(app.switcher.program, 4);
  assert.equal((await action({ type: 'program', input: 5 })).status, 400);
  assert.equal((await action({ type: 'cut' }, { origin: 'https://example.org' })).status, 403);
  assert.equal((await action({ type: 'settings', rate: 10, latencyFrames: 3 })).status, 200);
  assert.equal(app.switcher.latencyFrames, 3);
});

test('UDP loss: initial state retransmission and duplicate CUT are handled', { timeout: 6000 }, async t => {
  const sw = new Switcher(), server = new AtemServer(sw, { port: 0 });
  await server.listen(); const a = new Atem({ disableMultithreaded: true });
  t.after(async () => { await a.destroy(); sw.close(); await server.close(); });
  let dropped = false;
  const raw = server.raw.bind(server);
  server.raw = (c, b) => {
    if (!dropped && b.length > 20 && (b[0] >> 3 & 1)) { dropped = true; return; }
    raw(c, b);
  };
  const connected = once(a, 'connected', { signal: AbortSignal.timeout(3000) });
  await a.connect('127.0.0.1', server.port); await connected;
  assert.equal(dropped, true);
  assert.equal(a.state.video.mixEffects[0].programInput, 1);
  // Replay precisely the same client packet. It must be acknowledged twice,
  // but apply the state-changing command just once.
  server.socket.prependListener('message', (b, r) => {
    if (b.includes(Buffer.from('DCut'))) setTimeout(() => server.receive(b, r), 20);
  });
  await a.cut(); await delay(180);
  assert.equal(sw.program, 2); assert.equal(sw.preview, 1);
  assert.equal(a.state.video.mixEffects[0].programInput, 2);
});
