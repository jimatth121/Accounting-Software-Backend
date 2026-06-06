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

router.patch("/:id", (req, res) => {
  const store = req.store;
  const idx = store.payments.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Payment not found" });

  const current = store.payments[idx];
  const { id, createdAt, ...patch } = req.body || {};
  const updated = {
    ...current,
    ...patch,
    id: current.id,
    amount: patch.amount != null ? money(patch.amount) : current.amount,
    updatedAt: now()
  };
  store.payments[idx] = updated;
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const idx = store.payments.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Payment not found" });

  const payment = store.payments[idx];
  if (payment.paymentType === "incoming" && payment.invoiceId) {
    const invoice = store.invoices.find((item) => item.id === payment.invoiceId);
    if (invoice) {
      invoice.amountPaid = Math.max(invoice.amountPaid - payment.amount, 0);
      invoice.balanceDue = Math.max(invoice.totalAmount - invoice.amountPaid, 0);
      invoice.status = invoice.balanceDue === 0
        ? "Paid"
        : invoice.amountPaid > 0
          ? "Partially paid"
          : "Sent";
      invoice.updatedAt = now();
    }
  }
  store.payments.splice(idx, 1);
  res.json({ ok: true, id: req.params.id });
});

export default router;
