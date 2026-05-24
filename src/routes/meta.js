import { Router } from "express";
import { enrichInvoice } from "../services/invoices.js";
import { enrichExpense } from "../services/expenses.js";
import { dashboard, profitAndLoss } from "../services/reports.js";
import { detectAnomalies } from "../services/anomalies.js";

const router = Router();

export function bootstrapPayload(store) {
  return {
    company: store.company,
    customers: store.customers,
    vendors: store.vendors,
    invoices: store.invoices.map((invoice) => enrichInvoice(store, invoice)),
    expenses: store.expenses.map((expense) => enrichExpense(store, expense)),
    payments: store.payments,
    accounts: store.accounts,
    dashboard: dashboard(store),
    reports: { profitAndLoss: profitAndLoss(store) },
    anomalies: detectAnomalies(store)
  };
}

router.get("/", (req, res) => {
  res.json(bootstrapPayload(req.store));
});

export default router;
