// Optional end-to-end check against a separate, unmodified ATEM FT OBS checkout.
// Usage: node scripts/test-plugin.mjs /path/to/atem-ft-obs (run npm ci there first).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { createApp } from '../src/server.js';

const checkout = path.resolve(process.argv[2] || '../atem-ft-obs');
const requirePlugin = createRequire(path.join(checkout, 'package.json'));
const { WebSocketServer } = requirePlugin('ws');
const temp = await mkdtemp(path.join(tmpdir(), 'virtual-atem-plugin-'));
let app, child, obs;
let output = '';
try {
  const portServer = net.createServer(); portServer.listen(0, '127.0.0.1'); await once(portServer, 'listening');
  const port = portServer.address().port; await new Promise(resolve => portServer.close(resolve));
  obs = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(obs, 'listening');
  const scenes = [];
  obs.on('connection', socket => {
    socket.send(JSON.stringify({ op: 0, d: { obsWebSocketVersion: '5.5.0', rpcVersion: 1 } }));
    socket.on('message', data => {
      const m = JSON.parse(data);
      if (m.op === 1) socket.send(JSON.stringify({ op: 2, d: { negotiatedRpcVersion: 1 } }));
      if (m.op === 6) {
        if (m.d.requestType === 'SetCurrentProgramScene') scenes.push(m.d.requestData.sceneName);
        socket.send(JSON.stringify({ op: 7, d: { requestType: m.d.requestType, requestId: m.d.requestId, requestStatus: { result: true, code: 100 }, responseData: { currentProgramSceneName: scenes.at(-1) || 'Inicio' } } }));
      }
    });
  });
  app = await createApp({ port: 0, udpHost: '127.0.0.1', camera: false });
  const config = { version: 1, atem: { host: '127.0.0.1' }, obs: { url: `ws://127.0.0.1:${obs.address().port}`, password: '' }, followAtem: true, syncOnConnect: false,
    rules: [1, 2, 3, 4].flatMap(input => ['program', 'preview'].map(event => ({ id: `${event}-${input}`, enabled: true, event, input, actions: [{ type: 'obs.scene', scene: `${event}-${input}` }] }))),
    buttons: [{ id: 'cut', label: 'CUT propio', actions: [{ type: 'atem.cut' }] }, { id: 'auto', label: 'AUTO propio', actions: [{ type: 'atem.auto' }] }] };
  await writeFile(path.join(temp, 'config.json'), JSON.stringify(config));
  child = spawn(process.execPath, ['src/server.js'], { cwd: checkout, env: { ...process.env, PORT: String(port), ATEM_OBS_DATA_DIR: temp }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const base = `http://127.0.0.1:${port}`;
  let token;
  async function until(fn, timeout = 12000) {
    const end = Date.now() + timeout;
    while (!await fn()) { if (Date.now() > end) throw new Error(`Timeout. ${output}`); await delay(30); }
  }
  await until(async () => { try { token = (await (await fetch(base + '/api/session')).json()).token; return !!token; } catch { return false; } });
  const call = (route, body) => fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'x-session-token': token }, body: body ? JSON.stringify(body) : undefined });
  await until(async () => { const s = await (await call('/api/status')).json(); return s.atem && s.obs; });
  assert.equal(scenes.length, 0, 'initial sync does not trigger rules');
  app.switcher.select('program', 3); await until(() => scenes.includes('program-3'));
  app.switcher.select('preview', 4); await until(() => scenes.includes('preview-4'));
  app.switcher.cut(); await until(() => scenes.includes('program-4') && scenes.includes('preview-3'));
  app.switcher.configure({ rate: 6 }); app.switcher.auto();
  await until(async () => { const s = await (await call('/api/status')).json(); return s.program === 3 && s.preview === 4; });
  await until(() => scenes.filter(s => s === 'program-3').length === 2);
  for (const id of ['cut', 'auto']) {
    const count = scenes.length, before = app.switcher.program;
    const response = await call('/api/button', { id }); assert.equal(response.status, 200);
    await until(() => app.switcher.program !== before && !app.switcher.transition);
    await delay(200);
    assert.equal(scenes.length, count, `${id}: plugin suppresses its own ATEM echo`);
  }
  console.log('PASS: unmodified plugin service → real UDP ATEM → program/preview/CUT/AUTO → OBS WebSocket scene requests; initial sync and own-command echo suppression.');
} finally {
  if (child && child.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
  if (app) await app.close();
  if (obs) { for (const c of obs.clients) c.terminate(); await new Promise(resolve => obs.close(resolve)); }
  await rm(temp, { recursive: true, force: true });
}
