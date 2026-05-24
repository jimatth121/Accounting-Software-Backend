import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.payments));

router.post("/", (req, res) => {
  const store = req.store;
  const payment = {
    id: uid("pay"),
    paymentType: req.body.paymentType || "incoming",
    customerId: req.body.customerId || null,
    vendorId: req.body.vendorId || null,
    invoiceId: req.body.invoiceId || null,
    expenseId: req.body.expenseId || null,
    paymentDate: req.body.paymentDate || today(),
    amount: money(req.body.amount),
    currency: req.body.currency || store.company.defaultCurrency,
    paymentMethod: req.body.paymentMethod || "Bank transfer",
    reference: req.body.reference || "",
    notes: req.body.notes || "",
    createdAt: now(),
    updatedAt: now()
  };
  store.payments.push(payment);
  res.status(201).json(payment);
});

export default router;
