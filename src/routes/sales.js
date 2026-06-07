import { Router } from "express";
import { money, now, today, uid } from "../utils/helpers.js";
import { enrichInvoice, invoiceTotals, nextInvoiceNumber } from "../services/invoices.js";

const router = Router();

// Records a quick sale end-to-end:
//   1. Builds line items (from explicit items OR inventory references)
//   2. Decrements inventory quantities
//   3. Creates an invoice
//   4. If markPaid, creates a payment and clears the balance
router.post("/quick", (req, res) => {
  const store = req.store;
  const body = req.body || {};

  if (!body.customerId) return res.status(400).json({ error: "customerId is required" });
  const customer = (store.customers || []).find((c) => c.id === body.customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const inputItems = Array.isArray(body.items) && body.items.length ? body.items : [];
  if (!inputItems.length) return res.status(400).json({ error: "At least one line item is required" });

  if (!Array.isArray(store.inventory)) store.inventory = [];

  // Resolve each line item — if inventoryId provided, link & validate stock
  const resolvedItems = [];
  for (const raw of inputItems) {
    const quantity = Math.max(1, Number(raw.quantity) || 1);
    let description = raw.description || "Item";
    let unitPrice = money(raw.unitPrice);
    const taxRate = Number(raw.taxRate) || 0;
    const discountAmount = money(raw.discountAmount);
    let inventoryItem = null;

    if (raw.inventoryId) {
      inventoryItem = store.inventory.find((item) => item.id === raw.inventoryId);
      if (!inventoryItem) {
        return res.status(404).json({ error: `Inventory item ${raw.inventoryId} not found` });
      }
      if (inventoryItem.quantity < quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${inventoryItem.name} (have ${inventoryItem.quantity}, need ${quantity})` });
      }
      description = raw.description || inventoryItem.name;
      if (!raw.unitPrice) unitPrice = money(inventoryItem.unitPrice);
    }

    resolvedItems.push({
      description,
      quantity,
      unitPrice,
      taxRate,
      discountAmount,
      inventoryId: inventoryItem ? inventoryItem.id : null
    });
  }

  // Apply inventory deductions only after all validations pass
  for (const item of resolvedItems) {
    if (!item.inventoryId) continue;
    const inventoryItem = store.inventory.find((entry) => entry.id === item.inventoryId);
    inventoryItem.quantity = Math.max(0, inventoryItem.quantity - item.quantity);
    inventoryItem.updatedAt = now();
  }

  const totals = invoiceTotals(resolvedItems);
  const markPaid = body.markPaid !== false; // default to true (it's a "sale")
  const paymentMethod = body.paymentMethod || "Cash";
  const issueDate = body.issueDate || today();
  const dueDate = body.dueDate || issueDate;
  const status = body.status || (markPaid ? "Paid" : "Sent");

  const invoice = {
    id: uid("inv"),
    invoiceNumber: nextInvoiceNumber(store),
    customerId: customer.id,
    issueDate,
    dueDate,
    currency: body.currency || store.company.defaultCurrency,
    items: resolvedItems.map(({ inventoryId, ...rest }) => ({ ...rest, inventoryId })),
    ...totals,
    amountPaid: markPaid ? totals.totalAmount : 0,
    balanceDue: markPaid ? 0 : totals.totalAmount,
    status,
    notes: body.notes || "",
    terms: body.terms || (markPaid ? "Paid in full." : "Payment due within 30 days."),
    createdAt: now(),
    updatedAt: now()
  };
  store.invoices.push(invoice);

  let payment = null;
  if (markPaid) {
    payment = {
      id: uid("pay"),
      paymentType: "incoming",
      customerId: customer.id,
      vendorId: null,
      invoiceId: invoice.id,
      expenseId: null,
      paymentDate: issueDate,
      amount: totals.totalAmount,
      currency: invoice.currency,
      paymentMethod,
      reference: body.reference || `SALE-${invoice.invoiceNumber}`,
      notes: body.paymentNotes || `Sale settlement for ${invoice.invoiceNumber}`,
      createdAt: now(),
      updatedAt: now()
    };
    store.payments.push(payment);
  }

  res.status(201).json({
    invoice: enrichInvoice(store, invoice),
    payment,
    inventory: store.inventory.filter((entry) =>
      resolvedItems.some((item) => item.inventoryId === entry.id)
    )
  });
});

export default router;
