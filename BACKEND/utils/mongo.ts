import clientPromise from "./db/mongodb.js";
import type { Db } from "mongodb";
import connectMongoose from "./db/mongoose.js";

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB;
  if (!dbName) throw new Error("Missing MONGODB_DB env var");
  const client = await clientPromise;
  return client.db(dbName);
}

export async function mongo() {
  return connectMongoose();
}
