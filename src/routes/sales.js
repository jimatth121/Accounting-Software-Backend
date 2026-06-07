import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";
import {
  applyInventoryDeductions,
  enrichInvoice,
  invoiceTotals,
  nextInvoiceNumber,
  resolveInvoiceItems
} from "../services/invoices.js";

const router = Router();

// Records a quick sale end-to-end:
//   1. Builds line items (from explicit items OR inventory references)
//   2. Decrements inventory quantities
//   3. Creates an invoice
//   4. If markPaid, creates a payment and clears the balance
router.post("/quick", (req, res) => {
  const store = req.store;
  const body = req.body || {};

  // Resolve customer — accept an existing customerId OR a typed-in customerName.
  // A typed-in name that matches an existing customer (case-insensitive) is reused;
  // otherwise a brand-new customer record is created so the workspace can keep
  // track of them.
  if (!Array.isArray(store.customers)) store.customers = [];
  let customer = null;
  let customerCreated = false;
  if (body.customerId) {
    customer = store.customers.find((c) => c.id === body.customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
  } else if (body.customerName && String(body.customerName).trim()) {
    const name = String(body.customerName).trim();
    customer = store.customers.find((c) => (c.name || "").toLowerCase() === name.toLowerCase());
    if (!customer) {
      customer = {
        id: uid("cus"),
        name,
        companyName: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        openingBalance: 0,
        notes: "Created from a quick sale",
        createdAt: now(),
        updatedAt: now()
      };
      store.customers.push(customer);
      customerCreated = true;
    }
  } else {
    return res.status(400).json({ error: "customerId or customerName is required" });
  }

  const inputItems = Array.isArray(body.items) && body.items.length ? body.items : [];
  if (!inputItems.length) return res.status(400).json({ error: "At least one line item is required" });

  // Resolve each line item — inventory-backed items are linked & stock-checked,
  // manually typed items pass through as-is.
  const resolved = resolveInvoiceItems(store, inputItems);
  if (resolved.error) return res.status(resolved.error.status).json({ error: resolved.error.message });
  const resolvedItems = resolved.items;

  // Apply inventory deductions only after all validations pass
  applyInventoryDeductions(store, resolvedItems);

  const totals = invoiceTotals(resolvedItems);
  const paymentMethod = body.paymentMethod || "Cash";
  const issueDate = body.issueDate || today();
  const dueDate = body.dueDate || issueDate;

  // Resolve amount paid. Accepts either a numeric `amountPaid` (preferred) or
  // the legacy `markPaid` boolean. Defaults to the full total — i.e. it IS a sale.
  let amountPaid;
  if (body.amountPaid !== undefined && body.amountPaid !== null) {
    amountPaid = Math.min(Math.max(money(body.amountPaid), 0), totals.totalAmount);
  } else if (body.markPaid === false) {
    amountPaid = 0;
  } else {
    amountPaid = totals.totalAmount;
  }
  const balanceDue = Math.max(totals.totalAmount - amountPaid, 0);

  let status;
  if (body.status) status = body.status;
  else if (balanceDue <= 0) status = "Paid";
  else if (amountPaid > 0) status = "Partially paid";
  else status = "Sent";

  const terms = body.terms
    ? body.terms
    : balanceDue <= 0
    ? "Paid in full."
    : amountPaid > 0
    ? `Partial payment received. Outstanding balance due.`
    : "Payment due within 30 days.";

  const invoice = {
    id: uid("inv"),
    invoiceNumber: nextInvoiceNumber(store),
    customerId: customer.id,
    issueDate,
    dueDate,
    currency: body.currency || store.company.defaultCurrency,
    items: resolvedItems.map(({ inventoryId, ...rest }) => ({ ...rest, inventoryId })),
    ...totals,
    amountPaid,
    balanceDue,
    status,
    notes: body.notes || "",
    terms,
    createdAt: now(),
    updatedAt: now()
  };
  store.invoices.push(invoice);

  let payment = null;
  if (amountPaid > 0) {
    payment = {
      id: uid("pay"),
      paymentType: "incoming",
      customerId: customer.id,
      vendorId: null,
      invoiceId: invoice.id,
      expenseId: null,
      paymentDate: issueDate,
      amount: amountPaid,
      currency: invoice.currency,
      paymentMethod,
      reference: body.reference || `SALE-${invoice.invoiceNumber}`,
      notes:
        body.paymentNotes ||
        (balanceDue <= 0
          ? `Sale settlement for ${invoice.invoiceNumber}`
          : `Partial payment for ${invoice.invoiceNumber}`),
      createdAt: now(),
      updatedAt: now()
    };
    store.payments.push(payment);
  }

  res.status(201).json({
    invoice: enrichInvoice(store, invoice),
    payment,
    customer,
    customerCreated,
    inventory: store.inventory.filter((entry) =>
      resolvedItems.some((item) => item.inventoryId === entry.id)
    )
  });
});

export default router;
