// Utilities to convert Firestore/SDK values into plain JSON-safe objects

export function serializeFirestore<T = any>(input: T): T {
  return _serialize(input) as T;
}

// Mongo-safe serializer: removes _id and converts Dates
export function serializeMongo<T = any>(input: T): T {
  return _serializeMongo(input) as T;
}

function _serialize(val: any): any {
  if (val === null || val === undefined) return val;

  // Arrays
  if (Array.isArray(val)) return val.map(_serialize);

  const t = typeof val;
  if (t !== 'object') return val; // string, number, boolean

  // Firestore Timestamp (client/admin SDK): has toDate/toMillis
  if (typeof (val as any).toDate === 'function' && typeof (val as any).toMillis === 'function') {
    return (val as any).toMillis();
  }

  // Firestore Timestamp plain shape from JSON: {_seconds, _nanoseconds}
  if (
    typeof (val as any)._seconds === 'number' &&
    typeof (val as any)._nanoseconds === 'number'
  ) {
    const ms = (val as any)._seconds * 1000 + Math.floor((val as any)._nanoseconds / 1e6);
    return ms;
  }

  // Date -> milliseconds (to avoid class instances in props)
  if (val instanceof Date) {
    return val.getTime();
  }

  // Generic object: shallow copy with serialized properties
  const out: Record<string, any> = {};
  for (const k of Object.keys(val)) {
    out[k] = _serialize((val as any)[k]);
  }
  return out;
}

function _serializeMongo(val: any): any {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(_serializeMongo);
  const t = typeof val;
  if (t !== 'object') return val;

  // Convert Dates to ms
  if (val instanceof Date) return val.getTime();

  // Convert Mongo ObjectId to string or drop _id entirely
  // We choose to DROP _id to keep client shapes simple
  const out: Record<string, any> = {};
  for (const k of Object.keys(val)) {
    if (k === '_id') continue;
    const v = (val as any)[k];
    // If value looks like ObjectId, convert to string
    if (v && typeof v === 'object' && typeof (v as any).toHexString === 'function') {
      out[k] = (v as any).toHexString();
    } else {
      out[k] = _serializeMongo(v);
    }
  }
  return out;
}
