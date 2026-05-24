import "dotenv/config";
import { DEMO_USER_ID, DEMO_USER_PROFILE } from "./demoUser.js";
import { seedForUser } from "./seed.js";
import { upsertUser } from "./store.js";

await upsertUser(DEMO_USER_ID, seedForUser({ profile: DEMO_USER_PROFILE }));

console.log(`Demo user seeded: ${DEMO_USER_ID}`);
process.exit(0);
