import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { pathToFileURL } from 'node:url';
import { Switcher } from './switcher.js';
import { AtemServer } from './atem-server.js';
import { VideoOutput } from './video.js';

export async function createApp({ port = 39124, udpPort = 9910, udpHost = '0.0.0.0', camera = true } = {}) {
  const switcher = new Switcher(), messages = [], streams = new Set();
  const log = message => { messages.unshift({ time: new Date().toISOString(), message }); messages.length = Math.min(messages.length, 60); };
  const atem = new AtemServer(switcher, { port: udpPort, host: udpHost, log });
  const video = new VideoOutput(switcher, log), token = randomBytes(24).toString('hex');
  const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
  let authority;
  const status = () => ({ ...switcher.snapshot(), clients: [...atem.sessions.values()].filter(c => c.ready).length,
    camera: video.status, messages, udpHost, udpPort: atem.port, addresses: Object.values(networkInterfaces()).flat().filter(a => a.family === 'IPv4' && !a.internal).map(a => a.address) });
  const server = http.createServer(async (req, res) => {
    const reply = (code, value) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      if (req.headers.host !== authority || (req.headers.origin && req.headers.origin !== `http://${authority}`)) return reply(403, { error: 'Origen no autorizado' });
      const url = new URL(req.url, `http://${authority}`);
      if (req.method === 'GET' && files.has(url.pathname)) {
        const [file, type] = files.get(url.pathname);
        const body = await readFile(new URL(`../public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Content-Security-Policy': "default-src 'self'; frame-ancestors 'self'; object-src 'none'", 'X-Content-Type-Options': 'nosniff' }); return res.end(body);
      }
      if (req.method === 'GET' && url.pathname === '/api/session') return reply(200, { token });
      if (req.headers['x-session-token'] !== token) return reply(403, { error: 'Sesión inválida' });
      if (req.method === 'GET' && url.pathname === '/api/status') return reply(200, status());
      if (req.method !== 'POST' || url.pathname !== '/api/action') return reply(404, { error: 'Ruta desconocida' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) return reply(413, { error: 'Solicitud demasiado grande' }); }
      const action = JSON.parse(body);
      if (action.type === 'program' || action.type === 'preview') switcher.select(action.type, action.input);
      else if (action.type === 'cut') switcher.cut();
      else if (action.type === 'auto') switcher.auto();
      else if (action.type === 'settings') switcher.configure(action);
      else if (action.type === 'disconnect') { atem.sessions.clear(); log('Sesiones desconectadas para probar reconexión'); }
      else return reply(400, { error: 'Acción desconocida' });
      log(`Panel: ${action.type}${action.type === 'settings' ? ` · ${switcher.resolution} · 30 FPS` : ''}`); reply(200, status());
    } catch (e) { reply(400, { error: e.message }); }
  });
  server.on('connection', socket => { streams.add(socket); socket.on('close', () => streams.delete(socket)); });
  await atem.listen();
  try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); }); }
  catch (e) { await atem.close(); throw e; }
  const actualPort = server.address().port; authority = `127.0.0.1:${actualPort}`;
  if (camera) video.start();
  log('Emulador iniciado · ATEM Mini · 720p30 · MIX');
  return { server, switcher, atem, video, port: actualPort, async close() {
    switcher.close(); const closing = new Promise(resolve => server.close(resolve));
    for (const socket of streams) socket.destroy();
    await Promise.all([closing, atem.close(), video.close()]);
  } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const app = await createApp({ port: Number(process.env.PORT || 39124), udpHost: process.env.ATEM_BIND || '0.0.0.0', camera: !process.argv.includes('--no-camera') });
    console.log(`Virtual ATEM · panel local en el puerto ${app.port} · UDP ${app.atem.port}`);
    let closing = false;
    const shutdown = async () => { if (closing) return; closing = true; await app.close(); };
    process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
  } catch (e) { console.error(`No se pudo iniciar: ${e.message}`); process.exitCode = 1; }
}
