import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";
import {
  applyInventoryDeductions,
  enrichInvoice,
  invoiceTotals,
  nextInvoiceNumber,
  resolveInvoiceItems,
  restoreInventory
} from "../services/invoices.js";
import { paginate } from "../utils/pagination.js";

const router = Router();

router.get("/", (req, res) => {
  const { status, customerId, dateFrom, dateTo } = req.query;
  let rows = req.store.invoices.map((invoice) => enrichInvoice(req.store, invoice));
  if (status) rows = rows.filter((row) => row.status === status);
  if (customerId) rows = rows.filter((row) => row.customerId === customerId);
  if (dateFrom) rows = rows.filter((row) => (row.issueDate || "") >= dateFrom);
  if (dateTo) rows = rows.filter((row) => (row.issueDate || "") <= dateTo);
  res.json(paginate(rows, req.query, ["invoiceNumber", "customerName", "status"]));
});

router.post("/", (req, res) => {
  const store = req.store;
  // Line items can mix inventory-backed items (with `inventoryId`) and
  // manually typed one-off items. Falls back to a single item built from the
  // legacy `description` / `amount` fields when no items are supplied.
  const inputItems = req.body.items?.length
    ? req.body.items
    : [{ description: req.body.description || "Service", quantity: 1, unitPrice: money(req.body.amount), taxRate: 0, discountAmount: 0 }];
  const resolved = resolveInvoiceItems(store, inputItems);
  if (resolved.error) return res.status(resolved.error.status).json({ error: resolved.error.message });
  const items = resolved.items;
  applyInventoryDeductions(store, items);
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

router.patch("/:id", (req, res) => {
  const store = req.store;
  const idx = store.invoices.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invoice not found" });

  const current = store.invoices[idx];
  const { id, invoiceNumber, createdAt, items, amountPaid, ...patch } = req.body || {};

  let nextItems = current.items;
  if (items?.length) {
    // Free the stock the invoice currently holds, then validate & deduct the
    // new selection so inventory levels stay consistent across edits.
    restoreInventory(store, current.items);
    const resolved = resolveInvoiceItems(store, items);
    if (resolved.error) {
      applyInventoryDeductions(store, current.items); // roll back the restore
      return res.status(resolved.error.status).json({ error: resolved.error.message });
    }
    nextItems = resolved.items;
    applyInventoryDeductions(store, nextItems);
  }

  const totals = invoiceTotals(nextItems);
  const nextAmountPaid = amountPaid != null ? money(amountPaid) : current.amountPaid;
  const updated = {
    ...current,
    ...patch,
    id: current.id,
    invoiceNumber: current.invoiceNumber,
    items: nextItems,
    ...totals,
    amountPaid: nextAmountPaid,
    balanceDue: Math.max(totals.totalAmount - nextAmountPaid, 0),
    updatedAt: now()
  };
  store.invoices[idx] = updated;
  res.json(enrichInvoice(store, updated));
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const removed = store.invoices.find((item) => item.id === req.params.id);
  if (!removed) return res.status(404).json({ error: "Invoice not found" });
  store.invoices = store.invoices.filter((item) => item.id !== req.params.id);
  restoreInventory(store, removed.items); // return any inventory-backed stock
  store.payments = store.payments.filter((payment) => payment.invoiceId !== req.params.id);
  res.json({ ok: true, id: req.params.id });
});

export default router;
