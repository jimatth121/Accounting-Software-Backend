import { Router } from "express";
import { enrichInvoice } from "../services/invoices.js";
import { enrichExpense } from "../services/expenses.js";
import { dashboard, profitAndLoss } from "../services/reports.js";
import { detectAnomalies } from "../services/anomalies.js";

const router = Router();

router.get("/", (req, res) => {
  const store = req.store;
  res.json({
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
  });
});

export default router;
