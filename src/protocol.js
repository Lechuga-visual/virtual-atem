// ATEM wire format: 12-byte UDP header; commands have an 8-byte header.
export const MOD = 32768;
export function covered(ack, id) { return (ack - id + MOD) % MOD < MOD / 2; }
export function packet(flags, session, id = 0, payload = Buffer.alloc(0), ack = 0, request = 0) {
  const b = Buffer.alloc(12 + payload.length);
  b.writeUInt16BE((flags << 11) | b.length, 0); b.writeUInt16BE(session, 2);
  b.writeUInt16BE(ack, 4); b.writeUInt16BE(request, 6); b.writeUInt16BE(id, 10);
  payload.copy(b, 12); return b;
}
export function command(name, data = Buffer.alloc(0)) {
  const b = Buffer.alloc(8 + data.length);
  b.writeUInt16BE(b.length); b.write(name, 4, 4, 'ascii'); data.copy(b, 8); return b;
}
export function parseCommands(b) {
  const result = [];
  for (let offset = 0; offset < b.length;) {
    if (b.length - offset < 8) throw new Error('Cabecera de comando incompleta');
    const size = b.readUInt16BE(offset);
    if (size < 8 || offset + size > b.length) throw new Error('Longitud de comando inválida');
    result.push({ name: b.toString('ascii', offset + 4, offset + 8), data: b.subarray(offset + 8, offset + size) });
    offset += size;
  }
  return result;
}
export function stateCommands(s) {
  const input = value => { const b = Buffer.alloc(4); b.writeUInt16BE(value, 2); return b; };
  const position = Buffer.alloc(8); position[1] = +s.inTransition; position[2] = s.remainingFrames; position.writeUInt16BE(s.position, 4);
  return [command('PrgI', input(s.program)), command('PrvI', input(s.preview)), command('TrPs', position), command('TMxP', Buffer.from([0, s.rate, 0, 0]))];
}
export function initialCommands(s) {
  const version = Buffer.alloc(4); version.writeUInt32BE(131102);
  const product = Buffer.alloc(44); product.write('ATEM Mini'); product[40] = 13;
  // Only the implemented video switching capabilities are advertised.
  const topology = Buffer.alloc(24); topology[0] = 1; topology[1] = 4;
  const inputs = [1, 2, 3, 4].map(i => {
    const b = Buffer.alloc(36); b.writeUInt16BE(i); b.write(`Camera ${i}`, 2); b.write(`CAM${i}`, 22);
    b[26] = 1; b.writeUInt16BE(8, 28); b.writeUInt16BE(8, 30); b[34] = 1; b[35] = 1;
    return command('InPr', b);
  });
  return [command('_ver', version), command('_pin', product), command('_top', topology), command('_MeC', Buffer.alloc(4)), ...inputs,
    command('VidM', Buffer.from([26, 0, 0, 0])), command('TrSS', Buffer.from([0, 0, 1, 0, 1, 0, 0, 0])), ...stateCommands(s), command('InCm', Buffer.alloc(4))];
}
