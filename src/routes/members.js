import { Router } from "express";
import { now, uid } from "../utils/helpers.js";
import { ROLES } from "../services/access.js";
import { inviteSignUpUrl, isClerkConfigured, revokeInvitation, sendInvitation } from "../services/clerk.js";

const router = Router();

function ensureMembers(store) {
  if (!Array.isArray(store.members)) store.members = [];
  return store.members;
}

function isAdmin(req) {
  return req.currentMember?.role === "Administrator";
}

function inviteSummary(member, result) {
  return {
    member,
    invitation: {
      mode: result.mode,
      emailSent: result.ok,
      status: result.status || (result.ok ? "pending" : "not_sent"),
      url: result.url || inviteSignUpUrl(),
      errorCode: result.code || null,
      error: result.ok ? null : result.error || null
    },
    clerkConfigured: isClerkConfigured()
  };
}

router.get("/", (req, res) => {
  res.json(ensureMembers(req.store));
});

router.get("/me", (req, res) => {
  res.json({ member: req.currentMember, workspaceUserId: req.workspaceUserId });
});

router.post("/", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Only an administrator can invite members" });

  const members = ensureMembers(req.store);
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email is required" });
  if (members.some((m) => (m.email || "").toLowerCase() === email)) {
    return res.status(409).json({ error: "This email is already a member of the workspace" });
  }

  const role = ROLES.includes(req.body.role) ? req.body.role : "Member";
  const workspaceName = req.store.company?.name || "SmartBooks workspace";

  const result = await sendInvitation({ email, role, workspaceName });

  const member = {
    id: uid("mem"),
    name: req.body.name || email.split("@")[0],
    email,
    role,
    status: "pending",
    clerkUserId: "",
    isOwner: false,
    invitedAt: now(),
    joinedAt: null,
    clerkInvitationId: result.ok ? result.id || null : null,
    inviteEmailSent: result.ok,
    inviteUrl: result.url || ""
  };
  members.push(member);

  res.status(201).json(inviteSummary(member, result));
});

router.post("/:id/resend", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Only an administrator can resend invitations" });

  const members = ensureMembers(req.store);
  const member = members.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  if (member.status === "active" || member.clerkUserId) {
    return res.status(400).json({ error: "Member has already joined" });
  }

  // Revoke any previous Clerk invitation, then send a fresh one.
  if (member.clerkInvitationId) {
    await revokeInvitation(member.clerkInvitationId);
  }
  const workspaceName = req.store.company?.name || "SmartBooks workspace";
  const result = await sendInvitation({ email: member.email, role: member.role, workspaceName });

  member.clerkInvitationId = result.ok ? result.id || null : null;
  member.inviteEmailSent = result.ok;
  member.inviteUrl = result.url || member.inviteUrl || "";
  member.invitedAt = now();

  res.json(inviteSummary(member, result));
});

router.patch("/:id", (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Only an administrator can edit members" });

  const members = ensureMembers(req.store);
  const idx = members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Member not found" });
  const current = members[idx];
  if (current.isOwner) {
    if (req.body.role && req.body.role !== "Administrator") {
      return res.status(400).json({ error: "Cannot change the owner's role" });
    }
  }

  const { id, isOwner, clerkUserId, joinedAt, invitedAt, clerkInvitationId, inviteEmailSent, inviteUrl, ...patch } =
    req.body || {};
  if (patch.role && !ROLES.includes(patch.role)) {
    return res.status(400).json({ error: `role must be one of ${ROLES.join(", ")}` });
  }
  if (patch.email) patch.email = String(patch.email).trim().toLowerCase();

  members[idx] = { ...current, ...patch };
  res.json(members[idx]);
});

router.delete("/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Only an administrator can remove members" });

  const members = ensureMembers(req.store);
  const target = members.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.isOwner) return res.status(400).json({ error: "Cannot remove the workspace owner" });

  if (target.clerkInvitationId && !target.clerkUserId) {
    await revokeInvitation(target.clerkInvitationId);
  }
  req.store.members = members.filter((m) => m.id !== req.params.id);
  res.json({ ok: true, id: req.params.id });
});

export default router;
