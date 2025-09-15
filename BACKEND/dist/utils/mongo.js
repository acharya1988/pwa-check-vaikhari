import clientPromise from "./db/mongodb.js";
import connectMongoose from "./db/mongoose.js";
export async function getDb() {
    const dbName = process.env.MONGODB_DB;
    if (!dbName)
        throw new Error("Missing MONGODB_DB env var");
    const client = await clientPromise;
    return client.db(dbName);
}
export async function mongo() {
    return connectMongoose();
}
