// Roles, modules and the default permission matrix used by every workspace.

export const ROLES = ["Administrator", "Accountant", "Member", "Viewer"];

export const PERMISSION_MODULES = [
  "Dashboard",
  "Company",
  "Customers",
  "Vendors",
  "Invoices",
  "Expenses",
  "Payments",
  "Inventory",
  "Ledger",
  "Reports",
  "AI Assistant",
  "Settings"
];

export const PERMISSION_ACTIONS = ["read", "write", "delete"];

function allAccess() {
  return Object.fromEntries(PERMISSION_ACTIONS.map((action) => [action, true]));
}

function readOnly() {
  return { read: true, write: false, delete: false };
}

function readWrite() {
  return { read: true, write: true, delete: false };
}

function noAccess() {
  return { read: false, write: false, delete: false };
}

export function defaultPermissions() {
  const matrix = {};
  for (const role of ROLES) matrix[role] = {};
  for (const module of PERMISSION_MODULES) {
    matrix.Administrator[module] = allAccess();
    matrix.Accountant[module] =
      module === "Settings" ? noAccess() : module === "Reports" || module === "Dashboard" ? readOnly() : readWrite();
    matrix.Member[module] =
      module === "Settings"
        ? noAccess()
        : module === "Dashboard" || module === "Reports" || module === "Ledger"
        ? readOnly()
        : readWrite();
    matrix.Viewer[module] = module === "Settings" ? noAccess() : readOnly();
  }
  return matrix;
}

export function canPerform(permissions, role, module, action) {
  if (!role) return false;
  if (role === "Administrator") return true;
  const rolePerm = permissions?.[role];
  if (!rolePerm) return false;
  return Boolean(rolePerm[module]?.[action]);
}
