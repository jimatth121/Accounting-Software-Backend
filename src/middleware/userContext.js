import { getOrCreateUser, save } from "../db/store.js";

export function userContext(req, res, next) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ error: "Missing x-user-id header" });
  }

  let profile = {};
  const profileHeader = req.header("x-user-profile");
  if (profileHeader) {
    try {
      profile = JSON.parse(profileHeader);
    } catch {
      profile = {};
    }
  }

  req.userId = userId;
  req.store = getOrCreateUser(userId, profile);

  // Persist any mutations after the response is sent.
  res.on("finish", () => {
    save();
  });

  next();
}
