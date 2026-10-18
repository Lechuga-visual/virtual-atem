const $ = id => document.getElementById(id);
let token, refreshing = false;
let lastImage = "";
const colors = ['#1b6399', '#7c3d88', '#b07522', '#267c67'];
for (const bus of ['program', 'preview']) for (let i = 1; i <= 4; i++) {
  const b = document.createElement('button'); b.textContent = i; b.setAttribute('aria-label', `${bus} cámara ${i}`);
  b.onclick = () => action({ type: bus, input: i }); $(bus + '-buttons').append(b);
}
function source(ctx, input, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = colors[input - 1]; ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 190px system-ui'; ctx.fillText(input, 320, 180);
  ctx.font = '12px system-ui'; ctx.fillText(`CAMERA ${input}  /  VIRTUAL ATEM`, 320, 326); ctx.globalAlpha = 1;
}
function render(s) {
  const imageKey = `${s.program}:${s.preview}:${s.mix}`;
  if (imageKey !== lastImage) {
    source($('preview').getContext('2d'), s.preview);
    const ctx = $('program').getContext('2d'); source(ctx, s.program); if (s.inTransition) source(ctx, s.preview, s.mix);
    lastImage = imageKey;
  }
  for (const bus of ['program', 'preview']) [...$(bus + '-buttons').children].forEach((b, i) => { b.className = i + 1 === s[bus] ? bus : ''; b.disabled = s.inTransition; b.setAttribute('aria-pressed', String(i + 1 === s[bus])); });
  $('cut').disabled = $('auto').disabled = s.inTransition; $('progress').value = s.position;
  $('connection').textContent = `${s.clients} cliente${s.clients === 1 ? '' : 's'} ATEM conectado${s.clients === 1 ? '' : 's'}`;
  $('addresses').textContent = `Plugin en este PC: 127.0.0.1 · LAN: ${s.addresses.join(', ') || 'sin interfaz'} · UDP ${s.udpPort}`;
  $('camera').textContent = `Webcam: ${s.camera}`;
  $('delay').textContent = `${s.latencyFrames} fotogramas ≈ ${(s.latencyFrames * 1000 / s.fps).toFixed(0)} ms añadidos, más captura y buffering de OBS. Perfil sin calibrar con hardware.`;
  if (document.activeElement !== $('rate')) $('rate').value = s.rate;
  if (document.activeElement !== $('latency')) $('latency').value = s.latencyFrames;
  $('log').textContent = s.messages.map(m => `${new Date(m.time).toLocaleTimeString()}  ${m.message}`).join('\n');
}
async function request(path, body) {
  const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'x-session-token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json(); if (!r.ok) throw new Error(data.error); return data;
}
async function action(body) { try { render(await request('/api/action', body)); $('error').textContent = ''; } catch (e) { $('error').textContent = e.message; } }
$('cut').onclick = () => action({ type: 'cut' }); $('auto').onclick = () => action({ type: 'auto' });
$('settings').onsubmit = e => { e.preventDefault(); action({ type: 'settings', rate: Number($('rate').value), latencyFrames: Number($('latency').value) }); };
$('disconnect').onclick = () => action({ type: 'disconnect' });
async function refresh() {
  if (refreshing || document.hidden) return; refreshing = true;
  try { if (!token) token = (await (await fetch('/api/session')).json()).token; render(await request('/api/status')); }
  catch (e) { $('connection').textContent = 'Servicio sin conexión'; $('error').textContent = e.message; token = null; }
  finally { refreshing = false; }
}
await refresh();
setInterval(refresh, 200); // Stops fetching when the panel is hidden; no video is sent over HTTP.
document.addEventListener('visibilitychange', refresh);
