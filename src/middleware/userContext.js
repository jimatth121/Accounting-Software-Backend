import { now } from "../utils/helpers.js";
import { defaultPermissions } from "../services/access.js";
import {
  attachClerkIdToMember,
  findAccountByMemberEmail,
  getOrCreateUser,
  getUser,
  save
} from "../db/store.js";

// Backfills workspace membership + permissions for the signed-in owner.
// Workspaces created before the Team/Permissions feature have no `members`
// array, which left `currentMember` null — hiding admin controls (e.g. the
// invite button) and making permissions un-editable. This guarantees the owner
// always has an Administrator member record and a permission matrix.
function ensureOwnerMembership(store, userId, profile) {
  if (!Array.isArray(store.members)) store.members = [];
  let owner = store.members.find((m) => m.clerkUserId === userId) || store.members.find((m) => m.isOwner);
  if (!owner) {
    owner = {
      id: "mem_owner",
      name: profile.name || store.company?.name || "Account Owner",
      email: profile.email || store.company?.email || "",
      role: "Administrator",
      status: "active",
      clerkUserId: userId,
      isOwner: true,
      invitedAt: now(),
      joinedAt: now()
    };
    store.members.unshift(owner);
  }
  if (!owner.clerkUserId) owner.clerkUserId = userId;
  if (!owner.joinedAt) owner.joinedAt = now();
  if (!store.permissions) store.permissions = defaultPermissions();
  return owner;
}

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
  req.workspaceUserId = userId;
  req.currentMember = null;

  try {
    // 1. Does this Clerk userId already have its own workspace document?
    const existing = await getUser(userId);
    if (existing) {
      req.store = existing;
      req.workspaceUserId = userId;
      req.currentMember = ensureOwnerMembership(existing, userId, profile);
      await save();
    } else if (profile.email) {
      // 2. No workspace yet — check if some other workspace invited this email.
      const invite = await findAccountByMemberEmail(profile.email);
      if (invite) {
        await attachClerkIdToMember(invite.ownerUserId, invite.member.id, userId);
        req.store = invite.store;
        req.workspaceUserId = invite.ownerUserId;
        req.currentMember = invite.member;
      } else {
        // 3. Brand new user — seed their own workspace.
        req.store = await getOrCreateUser(userId, profile);
        req.workspaceUserId = userId;
        req.currentMember = ensureOwnerMembership(req.store, userId, profile);
      }
    } else {
      req.store = await getOrCreateUser(userId, profile);
      req.workspaceUserId = userId;
      req.currentMember = ensureOwnerMembership(req.store, userId, profile);
    }
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
