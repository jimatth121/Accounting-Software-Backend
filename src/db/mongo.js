import { MongoClient } from "mongodb";

let clientPromise;

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "smartbooks";

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(dbName);
}

export async function getUsersCollection() {
  const usersCollectionName = process.env.MONGODB_USERS_COLLECTION || "users";
  const db = await getMongoDb();
  return db.collection(usersCollectionName);
}
