import { getOrCreateUser, save } from "../db/store.js";

export async function userContext(req, res, next) {
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
  try {
    req.store = await getOrCreateUser(userId, profile);
  } catch (error) {
    console.error("Failed to load user store:", error);
    return res.status(500).json({ error: "Failed to load user data" });
  }

  const end = res.end;
  res.end = function endWithSave(...args) {
    save()
      .catch((error) => {
        console.error("Failed to save user store:", error);
      })
      .finally(() => {
        end.apply(res, args);
      });
    return res;
  };

  next();
}
