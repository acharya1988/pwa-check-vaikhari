import zlib from "node:zlib";

export function maybeCompress(req, res, bodyBuffer, contentType = "application/json; charset=utf-8") {
  const ae = req.headers["accept-encoding"] || "";
  res.setHeader("Content-Type", contentType);
  if (/\bbr\b/.test(ae)) {
    const out = zlib.brotliCompressSync(bodyBuffer);
    res.setHeader("Content-Encoding", "br");
    return out;
  }
  if (/\bgzip\b/.test(ae)) {
    const out = zlib.gzipSync(bodyBuffer);
    res.setHeader("Content-Encoding", "gzip");
    return out;
  }
  return bodyBuffer;
}

