import { Router } from "express";
import { enrichInvoice } from "../services/invoices.js";
import { enrichExpense } from "../services/expenses.js";
import { dashboard, profitAndLoss } from "../services/reports.js";
import { detectAnomalies } from "../services/anomalies.js";
import {
  defaultPermissions,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLES
} from "../services/access.js";

const router = Router();

export function bootstrapPayload(store, options = {}) {
  return {
    company: store.company,
    customers: store.customers,
    vendors: store.vendors,
    invoices: store.invoices.map((invoice) => enrichInvoice(store, invoice)),
    expenses: store.expenses.map((expense) => enrichExpense(store, expense)),
    payments: store.payments,
    accounts: store.accounts,
    inventory: Array.isArray(store.inventory) ? store.inventory : [],
    preferences: store.preferences || null,
    members: Array.isArray(store.members) ? store.members : [],
    permissions: {
      roles: ROLES,
      modules: PERMISSION_MODULES,
      actions: PERMISSION_ACTIONS,
      matrix: store.permissions || defaultPermissions()
    },
    currentMember: options.currentMember || null,
    workspaceUserId: options.workspaceUserId || null,
    dashboard: dashboard(store),
    reports: { profitAndLoss: profitAndLoss(store) },
    anomalies: detectAnomalies(store)
  };
}

router.get("/", (req, res) => {
  res.json(
    bootstrapPayload(req.store, {
      currentMember: req.currentMember,
      workspaceUserId: req.workspaceUserId
    })
  );
});

export default router;
