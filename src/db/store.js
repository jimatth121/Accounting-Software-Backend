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

function canUseLocalDataFile() {
  return !process.env.VERCEL;
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
}

function loadUsers() {
  if (isMongoConfigured() || !canUseLocalDataFile()) return;

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

  if (!canUseLocalDataFile()) {
    console.warn("Skipping local data file write because this runtime is read-only.");
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

// Return the user's store if it exists, without creating it.
export async function getUser(userId) {
  if (!userId) return null;
  await loadUserFromMongo(userId);
  return users[userId] || null;
}

export async function getOrCreateUser(userId, profile = {}) {
  await loadUserFromMongo(userId);

  if (!users[userId]) {
    users[userId] = seedForUser({ profile, ownerUserId: userId });
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
    changed = true;
  }

  // Make sure the owner record has the right clerkUserId
  const members = Array.isArray(users[userId].members) ? users[userId].members : [];
  const owner = members.find((member) => member.isOwner) || members[0];
  if (owner && !owner.clerkUserId) {
    owner.clerkUserId = userId;
    owner.joinedAt = owner.joinedAt || now();
    changed = true;
  }

  if (changed) await save();
  return users[userId];
}

// Look up an account that has invited a given email as a member.
// Returns { ownerUserId, store, member } or null.
export async function findAccountByMemberEmail(email) {
  if (!email) return null;
  const target = email.trim().toLowerCase();

  if (isMongoConfigured()) {
    const collection = await getUsersCollection();
    const doc = await collection.findOne({ "store.members.email": target });
    if (doc?.store) {
      const ownerUserId = doc._id;
      users[ownerUserId] = doc.store;
      loadedUserIds.add(ownerUserId);
      const member = (doc.store.members || []).find((m) => (m.email || "").toLowerCase() === target);
      return { ownerUserId, store: doc.store, member };
    }
    return null;
  }

  for (const [ownerUserId, store] of Object.entries(users)) {
    const member = (store.members || []).find((m) => (m.email || "").toLowerCase() === target);
    if (member) return { ownerUserId, store, member };
  }
  return null;
}

// Attach a Clerk user id to a pending member entry (called on first sign-in).
export async function attachClerkIdToMember(ownerUserId, memberId, clerkUserId) {
  const store = users[ownerUserId];
  if (!store) return;
  const member = (store.members || []).find((m) => m.id === memberId);
  if (!member) return;
  let changed = false;
  if (member.clerkUserId !== clerkUserId) {
    member.clerkUserId = clerkUserId;
    changed = true;
  }
  if (!member.joinedAt) {
    member.joinedAt = now();
    member.status = "active";
    changed = true;
  }
  if (changed) await save();
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
