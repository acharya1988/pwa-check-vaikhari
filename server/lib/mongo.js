import { MongoClient } from "mongodb";

let _client, _db;
export async function getDb() {
  if (_db) return _db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  _client = _client || new MongoClient(uri);
  if (!_client.topology) await _client.connect();
  const dbName = process.env.MONGODB_DB;
  if (!dbName) throw new Error("Missing MONGODB_DB");
  _db = _client.db(dbName);
  return _db;
}

