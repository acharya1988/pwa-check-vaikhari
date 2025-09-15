import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vAIkhari';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (mongoDb) return mongoDb;
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, {
      // modest pool that plays well for dev
      maxPoolSize: 10,
      minPoolSize: 0,
    });
    await mongoClient.connect();
  }
  mongoDb = mongoClient.db(MONGODB_DB);
  return mongoDb;
}

// Mongoose convenience for existing models
let mongooseConn: typeof mongoose | null = null;
export async function mongo() {
  if (mongooseConn) return mongooseConn;
  const conn = await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  mongooseConn = conn;
   console.log(`✅ Connected to MongoDB at ${MONGODB_URI}, database: ${MONGODB_DB}`);
 
  return conn;
}

export async function ensureIndexes() {
  await mongo();
  // Ensure commonly used indexes
  try {
    const drift = mongoose.connection.collection('drifts');
    await drift.createIndex({ userId: 1, updatedAt: -1 });
    await drift.createIndex({ status: 1 });
  } catch {}
  try {
    const layers = mongoose.connection.collection('layers');
    await layers.createIndex({ userId: 1, updatedAt: -1 });
    await layers.createIndex({ type: 1 });
  } catch {}
}

// OPDO-style app.ts expects a connectDb() entrypoint; reuse mongo()
export async function connectDb() {
  return mongo();
}
