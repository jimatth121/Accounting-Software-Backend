import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { now } from "../utils/helpers.js";
import { seedForUser } from "./seed.js";
import { getUsersCollection, isMongoConfigured } from "./mongo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

let users = {};
const loadedUserIds = new Set();

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
}

function loadUsers() {
  if (isMongoConfigured()) return;

  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    users = raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to load users.json:", error);
    users = {};
  }
}

loadUsers();

export async function save() {
  if (isMongoConfigured()) {
    const timestamp = now();
    const writes = Object.entries(users).map(([userId, store]) => ({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { store, updatedAt: timestamp }, $setOnInsert: { createdAt: timestamp } },
        upsert: true
      }
    }));

    if (!writes.length) return;

    const collection = await getUsersCollection();
    await collection.bulkWrite(writes);
    return;
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Failed to write users.json:", error);
  }
}

const COMPANY_PROFILE_KEYS = ["name", "email", "phone", "address", "country", "taxId"];

async function loadUserFromMongo(userId) {
  if (!isMongoConfigured() || loadedUserIds.has(userId)) return;

  const collection = await getUsersCollection();
  const document = await collection.findOne({ _id: userId });
  if (document?.store) {
    users[userId] = document.store;
  }
  loadedUserIds.add(userId);
}

export async function getOrCreateUser(userId, profile = {}) {
  await loadUserFromMongo(userId);

  if (!users[userId]) {
    users[userId] = seedForUser({ profile });
    await save();
    return users[userId];
  }

  // Backfill any company profile fields that are still missing
  const company = users[userId].company || {};
  let changed = false;
  for (const key of COMPANY_PROFILE_KEYS) {
    if (profile[key] && !company[key]) {
      company[key] = profile[key];
      changed = true;
    }
  }
  if (changed) {
    company.updatedAt = now();
    users[userId].company = company;
    await save();
  }

  return users[userId];
}

export function listUsers() {
  return Object.keys(users);
}

export async function upsertUser(userId, store) {
  users[userId] = store;
  loadedUserIds.add(userId);

  if (isMongoConfigured()) {
    const timestamp = now();
    const collection = await getUsersCollection();
    await collection.updateOne(
      { _id: userId },
      { $set: { store, updatedAt: timestamp }, $setOnInsert: { createdAt: timestamp } },
      { upsert: true }
    );
    return users[userId];
  }

  save();
  return users[userId];
}

export async function deleteUser(userId) {
  delete users[userId];
  loadedUserIds.delete(userId);
  if (isMongoConfigured()) {
    const collection = await getUsersCollection();
    await collection.deleteOne({ _id: userId });
    return;
  }
  save();
}
