import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";
import { enrichInvoice, invoiceTotals, nextInvoiceNumber } from "../services/invoices.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.invoices.map((invoice) => enrichInvoice(req.store, invoice))));

router.post("/", (req, res) => {
  const store = req.store;
  const items = req.body.items?.length
    ? req.body.items
    : [{ description: req.body.description || "Service", quantity: 1, unitPrice: money(req.body.amount), taxRate: 0, discountAmount: 0 }];
  const totals = invoiceTotals(items);
  const amountPaid = money(req.body.amountPaid);
  const invoice = {
    id: uid("inv"),
    invoiceNumber: nextInvoiceNumber(store),
    customerId: req.body.customerId,
    issueDate: req.body.issueDate || today(),
    dueDate: req.body.dueDate,
    currency: req.body.currency || store.company.defaultCurrency,
    items,
    ...totals,
    amountPaid,
    balanceDue: totals.totalAmount - amountPaid,
    status: req.body.status || "Draft",
    notes: req.body.notes || "",
    terms: req.body.terms || "Payment due within 30 days.",
    createdAt: now(),
    updatedAt: now()
  };
  store.invoices.push(invoice);
  res.status(201).json(enrichInvoice(store, invoice));
});

router.post("/:id/mark-paid", (req, res) => {
  const store = req.store;
  const invoice = store.invoices.find((item) => item.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const amount = money(req.body.amount || invoice.balanceDue);
  invoice.amountPaid += amount;
  invoice.balanceDue = Math.max(invoice.totalAmount - invoice.amountPaid, 0);
  invoice.status = invoice.balanceDue === 0 ? "Paid" : "Partially paid";
  invoice.updatedAt = now();

  const payment = {
    id: uid("pay"),
    paymentType: "incoming",
    customerId: invoice.customerId,
    vendorId: null,
    invoiceId: invoice.id,
    expenseId: null,
    paymentDate: req.body.paymentDate || today(),
    amount,
    currency: invoice.currency,
    paymentMethod: req.body.paymentMethod || "Bank transfer",
    reference: req.body.reference || "",
    notes: req.body.notes || `Payment for ${invoice.invoiceNumber}`,
    createdAt: now(),
    updatedAt: now()
  };
  store.payments.push(payment);

  res.json({ invoice: enrichInvoice(store, invoice), payment });
});

export default router;
