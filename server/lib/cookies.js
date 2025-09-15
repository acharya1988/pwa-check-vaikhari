export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf("=");
        return i >= 0
          ? [decodeURIComponent(kv.slice(0, i)), decodeURIComponent(kv.slice(i + 1))]
          : [kv, ""];
      })
  );
}

export function serializeCookie(name, value, opts = {}) {
  const p = [];
  p.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  if (opts.maxAge != null) p.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.domain) p.push(`Domain=${opts.domain}`);
  if (opts.path) p.push(`Path=${opts.path}`);
  if (opts.expires) p.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.httpOnly) p.push("HttpOnly");
  if (opts.secure) p.push("Secure");
  if (opts.sameSite) p.push(`SameSite=${opts.sameSite}`);
  return p.join("; ");
}

