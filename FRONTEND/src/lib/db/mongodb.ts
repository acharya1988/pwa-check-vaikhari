
import { MongoClient } from 'mongodb';

// Connect lazily to avoid triggering DB connections during build/prerender.
// Do NOT throw at module import time since Next may import modules while analyzing.

const options = {} as Parameters<typeof MongoClient.prototype.connect>[0] | undefined;

let clientPromise: Promise<MongoClient> | undefined;

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const client = new MongoClient(uri, options);
  return client.connect();
}

export default function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    // Preserve client across HMR in dev
    const g = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
    if (!g._mongoClientPromise) {
      g._mongoClientPromise = createClientPromise();
    }
    return g._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  return clientPromise;
}
