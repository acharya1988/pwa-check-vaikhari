import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'src');
const offenders = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (s.isFile()) {
      const txt = readFileSync(p, 'utf8');
      if (/\bmongoose\b/.test(txt) || /firebase-admin/.test(txt) || /getDb\(/.test(txt)) {
        offenders.push(p);
      }
    }
  }
}

try {
  walk(root);
} catch {}

if (offenders.length) {
  console.error('[Forbidden imports found in frontend]');
  for (const f of offenders) console.error(' -', f);
  process.exit(1);
} else {
  console.log('Frontend clean: no forbidden imports');
}

