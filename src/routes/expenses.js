import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";
import { enrichExpense } from "../services/expenses.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.expenses.map((expense) => enrichExpense(req.store, expense))));

router.post("/", (req, res) => {
  const store = req.store;
  const expense = {
    id: uid("exp"),
    vendorId: req.body.vendorId,
    expenseDate: req.body.expenseDate || today(),
    amount: money(req.body.amount),
    taxAmount: money(req.body.taxAmount),
    currency: req.body.currency || store.company.defaultCurrency,
    category: req.body.category || "Operating Expenses",
    paymentMethod: req.body.paymentMethod || "Bank transfer",
    description: req.body.description || "",
    status: req.body.status || "Recorded",
    receiptName: req.body.receiptName || "",
    billable: Boolean(req.body.billable),
    createdAt: now(),
    updatedAt: now()
  };
  store.expenses.push(expense);
  res.status(201).json(enrichExpense(store, expense));
});

export default router;
