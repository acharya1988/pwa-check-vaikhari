import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join('perf', 'snapshots', 'before');
const PORT = process.env.PORT || '4000';
const BASE = `http://127.0.0.1:${PORT}`;

async function waitForServer(url, tries = 30, intervalMs = 500) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await delay(intervalMs);
  }
  return false;
}

async function hit(url) {
  const t0 = performance.now();
  const res = await fetch(url, { credentials: 'include' });
  const buf = new Uint8Array(await res.arrayBuffer());
  const t1 = performance.now();
  // Serialize headers
  const headers = {};
  res.headers.forEach((v, k) => (headers[k] = v));
  return {
    url,
    status: res.status,
    headers,
    bytes: buf.length,
    ms: Math.round(t1 - t0),
    body: (() => {
      try {
        return JSON.parse(Buffer.from(buf).toString('utf8'));
      } catch {
        return null;
      }
    })(),
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Start Node server
  const logPath = path.join('perf', 'snapshots', 'server.log');
  await mkdir(path.dirname(logPath), { recursive: true });
  const log = createWriteStream(logPath, { flags: 'a' });
  const child = spawn('node', ['server/server.js'], {
    env: { ...process.env, NODE_ENV: 'development', PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);

  const up = await waitForServer(`${BASE}/healthz`);
  if (!up) {
    child.kill('SIGTERM');
    throw new Error('Server did not start in time');
  }

  const endpoints = [
    `${BASE}/healthz`,
    `${BASE}/api/me`,
  ];

  for (const url of endpoints) {
    const cold = await hit(url);
    await delay(100);
    const warm = await hit(url);
    await writeFile(
      path.join(OUT_DIR, `${url.replaceAll(/[:/]/g, '_')}.json`),
      JSON.stringify({ cold, warm }, null, 2),
      'utf8'
    );
  }

  child.kill('SIGTERM');
}

main().catch((e) => {
  console.error('[snapshot] failed:', e);
  process.exitCode = 1;
});

