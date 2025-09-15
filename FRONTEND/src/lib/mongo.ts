import getMongoClient from "@/lib/db/mongodb";
import type { Db } from "mongodb";
import connectMongoose from "@/lib/db/mongoose";

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB;
  if (!dbName) throw new Error("Missing MONGODB_DB env var");
  const client = await getMongoClient();
  return client.db(dbName);
}

// Convenience: Mongoose connector for models/ORM usage
export async function mongo() {
  return connectMongoose();
}
