import { Router } from "express";
import {
  defaultPermissions,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLES
} from "../services/access.js";

const router = Router();

function ensurePermissions(store) {
  if (!store.permissions) store.permissions = defaultPermissions();
  // Ensure every role/module/action is represented (forward-compat backfill).
  for (const role of ROLES) {
    if (!store.permissions[role]) store.permissions[role] = {};
    for (const module of PERMISSION_MODULES) {
      if (!store.permissions[role][module]) store.permissions[role][module] = {};
      for (const action of PERMISSION_ACTIONS) {
        if (typeof store.permissions[role][module][action] !== "boolean") {
          store.permissions[role][module][action] = role === "Administrator";
        }
      }
    }
  }
  return store.permissions;
}

router.get("/", (req, res) => {
  res.json({
    roles: ROLES,
    modules: PERMISSION_MODULES,
    actions: PERMISSION_ACTIONS,
    matrix: ensurePermissions(req.store)
  });
});

router.patch("/", (req, res) => {
  if (req.currentMember?.role !== "Administrator") {
    return res.status(403).json({ error: "Only an administrator can edit permissions" });
  }

  const matrix = ensurePermissions(req.store);
  const body = req.body?.matrix || req.body || {};

  for (const [role, modules] of Object.entries(body)) {
    if (!ROLES.includes(role)) continue;
    if (role === "Administrator") continue; // always full access
    if (!matrix[role]) matrix[role] = {};
    for (const [module, actions] of Object.entries(modules || {})) {
      if (!PERMISSION_MODULES.includes(module)) continue;
      if (!matrix[role][module]) matrix[role][module] = {};
      for (const [action, value] of Object.entries(actions || {})) {
        if (!PERMISSION_ACTIONS.includes(action)) continue;
        matrix[role][module][action] = Boolean(value);
      }
    }
  }

  res.json({
    roles: ROLES,
    modules: PERMISSION_MODULES,
    actions: PERMISSION_ACTIONS,
    matrix
  });
});

router.post("/reset", (req, res) => {
  if (req.currentMember?.role !== "Administrator") {
    return res.status(403).json({ error: "Only an administrator can reset permissions" });
  }
  req.store.permissions = defaultPermissions();
  res.json({
    roles: ROLES,
    modules: PERMISSION_MODULES,
    actions: PERMISSION_ACTIONS,
    matrix: req.store.permissions
  });
});

export default router;
