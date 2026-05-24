import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { now } from "../utils/helpers.js";
import { seedForUser } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

let users = {};
let writeTimer = null;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
}

function loadUsers() {
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

export function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error("Failed to write users.json:", error);
    }
  }, 50);
}

const COMPANY_PROFILE_KEYS = ["name", "email", "phone", "address", "country", "taxId"];

export function getOrCreateUser(userId, profile = {}) {
  if (!users[userId]) {
    users[userId] = seedForUser({ profile });
    save();
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
    save();
  }

  return users[userId];
}

export function listUsers() {
  return Object.keys(users);
}

export function deleteUser(userId) {
  delete users[userId];
  save();
}
