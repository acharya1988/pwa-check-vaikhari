import { brotliCompressSync, gzipSync } from 'node:zlib';

const ENABLE_COMPRESSION = process.env.RESPONSE_COMPRESSION === '1';

export function setCors(res, req, origin) {
  const o = origin || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", o);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function json(res, status, obj) {
  res.statusCode = status;
  const bodyString = JSON.stringify(obj);
  // Optional compression behind env flag; default behavior unchanged.
  if (ENABLE_COMPRESSION) {
    try {
      const accept = /** @type {import('http').IncomingMessage | undefined} */ (res?.["_req"])?.headers?.["accept-encoding"] || '';
      const buff = Buffer.from(bodyString);
      if (accept.includes('br')) {
        const out = brotliCompressSync(buff);
        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(out.length));
        return res.end(out);
      }
      if (accept.includes('gzip')) {
        const out = gzipSync(buff);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(out.length));
        return res.end(out);
      }
    } catch {
      // fall through to uncompressed on any error
    }
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(bodyString);
}

export function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}
