import { canPerform, defaultPermissions } from "../services/access.js";

// Maps HTTP verbs to permission actions.
const METHOD_ACTION = {
  GET: "read",
  HEAD: "read",
  OPTIONS: "read",
  POST: "write",
  PUT: "write",
  PATCH: "write",
  DELETE: "delete"
};

// Guards a route group by the current member's role permissions for `module`.
// Administrators and the workspace owner always pass. If there is no member
// context at all (legacy single-user requests), we fail open so the app keeps
// working — userContext backfills an owner member for real workspaces.
export function requirePermission(module) {
  return (req, res, next) => {
    const member = req.currentMember;
    if (!member || !member.role) return next();
    if (member.role === "Administrator" || member.isOwner) return next();

    // Fall back to defaults if the workspace has no saved matrix yet, so roles
    // still get their baseline access instead of being denied everything.
    const matrix = req.store?.permissions || defaultPermissions();
    const action = METHOD_ACTION[req.method] || "read";
    if (canPerform(matrix, member.role, module, action)) return next();

    return res.status(403).json({
      error: `Your role (${member.role}) does not have permission to ${action} ${module}.`,
      module,
      action,
      role: member.role
    });
  };
}
