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

router.patch("/:id", (req, res) => {
  const store = req.store;
  const idx = store.expenses.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Expense not found" });

  const current = store.expenses[idx];
  const { id, createdAt, ...patch } = req.body || {};
  const updated = {
    ...current,
    ...patch,
    id: current.id,
    amount: patch.amount != null ? money(patch.amount) : current.amount,
    taxAmount: patch.taxAmount != null ? money(patch.taxAmount) : current.taxAmount,
    billable: patch.billable != null ? Boolean(patch.billable) : current.billable,
    updatedAt: now()
  };
  store.expenses[idx] = updated;
  res.json(enrichExpense(store, updated));
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const before = store.expenses.length;
  store.expenses = store.expenses.filter((item) => item.id !== req.params.id);
  if (store.expenses.length === before) return res.status(404).json({ error: "Expense not found" });
  store.payments = store.payments.filter((payment) => payment.expenseId !== req.params.id);
  res.json({ ok: true, id: req.params.id });
});

export default router;
