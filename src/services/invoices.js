import { money, now } from "../utils/helpers.js";

// Normalises the line items submitted on an invoice. Each item can either:
//   1. Reference an existing inventory item via `inventoryId` — the name and
//      unit price default to the inventory record and stock is validated, OR
//   2. Be typed in manually (no `inventoryId`) — a one-off item that is not
//      tracked in inventory.
// Returns { items } on success or { error: { status, message } } on failure.
export function resolveInvoiceItems(store, inputItems = []) {
  if (!Array.isArray(store.inventory)) store.inventory = [];

  const items = [];
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
        return { error: { status: 404, message: `Inventory item ${raw.inventoryId} not found` } };
      }
      if (inventoryItem.quantity < quantity) {
        return {
          error: {
            status: 400,
            message: `Insufficient stock for ${inventoryItem.name} (have ${inventoryItem.quantity}, need ${quantity})`
          }
        };
      }
      // Inventory record supplies the defaults; explicit values still win.
      description = raw.description || inventoryItem.name;
      if (!raw.unitPrice) unitPrice = money(inventoryItem.unitPrice);
    }

    items.push({
      description,
      quantity,
      unitPrice,
      taxRate,
      discountAmount,
      inventoryId: inventoryItem ? inventoryItem.id : null
    });
  }

  return { items };
}

// Decrements stock for any line items that reference an inventory record.
export function applyInventoryDeductions(store, items = []) {
  if (!Array.isArray(store.inventory)) return;
  for (const item of items) {
    if (!item.inventoryId) continue;
    const inventoryItem = store.inventory.find((entry) => entry.id === item.inventoryId);
    if (!inventoryItem) continue;
    inventoryItem.quantity = Math.max(0, inventoryItem.quantity - Number(item.quantity || 0));
    inventoryItem.updatedAt = now();
  }
}

// Returns stock previously deducted by an invoice's line items (used when an
// invoice is edited or deleted so inventory stays consistent).
export function restoreInventory(store, items = []) {
  if (!Array.isArray(store.inventory)) return;
  for (const item of items) {
    if (!item.inventoryId) continue;
    const inventoryItem = store.inventory.find((entry) => entry.id === item.inventoryId);
    if (!inventoryItem) continue;
    inventoryItem.quantity = Math.max(0, inventoryItem.quantity) + Number(item.quantity || 0);
    inventoryItem.updatedAt = now();
  }
}

export function invoiceTotals(items = []) {
  const subtotal = items.reduce((sum, item) => sum + money(item.quantity) * money(item.unitPrice), 0);
  const taxAmount = items.reduce((sum, item) => sum + money(item.quantity) * money(item.unitPrice) * (money(item.taxRate) / 100), 0);
  const discountAmount = items.reduce((sum, item) => sum + money(item.discountAmount), 0);
  const totalAmount = subtotal + taxAmount - discountAmount;

  return { subtotal, taxAmount, discountAmount, totalAmount };
}

export function nextInvoiceNumber(store) {
  const next = store.invoices.length + 1;
  return `INV-${String(next).padStart(6, "0")}`;
}

export function enrichInvoice(store, invoice) {
  const customer = store.customers.find((item) => item.id === invoice.customerId);
  const dueDate = new Date(`${invoice.dueDate}T00:00:00`);
  const isOverdue = invoice.balanceDue > 0 && dueDate < new Date();

  return {
    ...invoice,
    customerName: customer?.name || "Unknown customer",
    status: isOverdue && !["Paid", "Cancelled", "Void"].includes(invoice.status) ? "Overdue" : invoice.status
  };
}
