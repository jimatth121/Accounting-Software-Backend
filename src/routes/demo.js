import { Router } from "express";
import { DEMO_USER_ID, DEMO_USER_PROFILE } from "../db/demoUser.js";
import { isMongoConfigured } from "../db/mongo.js";
import { getOrCreateUser } from "../db/store.js";
import { bootstrapPayload } from "./meta.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    userId: DEMO_USER_ID,
    profile: DEMO_USER_PROFILE,
    header: { "x-user-id": DEMO_USER_ID },
    bootstrapPath: "/api/bootstrap"
  });
});

router.get("/bootstrap", async (req, res) => {
  if (process.env.VERCEL && !isMongoConfigured()) {
    return res.status(500).json({ error: "MONGODB_URI is not configured in Vercel environment variables" });
  }

  try {
    const store = await getOrCreateUser(DEMO_USER_ID, DEMO_USER_PROFILE);
    res.json(bootstrapPayload(store));
  } catch (error) {
    console.error("Failed to load demo data:", error);
    res.status(500).json({ error: "Failed to load demo data" });
  }
});

export default router;
