import net from 'net';
export type ClamVerdict = 'OK' | `FOUND:${string}` | 'UNAVAILABLE';

function writeChunk(socket: net.Socket, chunk: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(chunk.length);
  socket.write(len);
  socket.write(chunk);
}
export async function scanBufferWithClamAV(buffer: Buffer, opts?: { host?: string; port?: number; timeoutMs?: number }): Promise<ClamVerdict> {
  const host = opts?.host ?? process.env.CLAMAV_HOST ?? '127.0.0.1';
  const port = Number(opts?.port ?? process.env.CLAMAV_PORT ?? 3310);
  const timeoutMs = opts?.timeoutMs ?? 15000;

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let data = '';
    let ended = false;
    const end = (v: ClamVerdict) => { if (ended) return; ended = true; try { socket.destroy(); } catch {} resolve(v); };
    socket.setTimeout(timeoutMs, () => end('UNAVAILABLE'));
    socket.connect(port, host, () => {
      socket.write('zINSTREAM\0');
      const CHUNK = 64 * 1024;
      for (let i = 0; i < buffer.length; i += CHUNK) {
        writeChunk(socket, buffer.subarray(i, Math.min(i + CHUNK, buffer.length)));
      }
      socket.write(Buffer.from([0, 0, 0, 0])); // end
    });
    socket.on('data', (b) => (data += b.toString('utf8')));
    socket.on('error', () => end('UNAVAILABLE'));
    socket.on('close', () => {
      const line = data.trim();
      if (!line) return end('UNAVAILABLE');
      if (line.endsWith('OK')) return end('OK');
      const m = line.match(/\b(.+?)\s+FOUND$/);
      if (m) return end(`FOUND:${m[1]}` as ClamVerdict);
      return end('UNAVAILABLE');
    });
  });
}
