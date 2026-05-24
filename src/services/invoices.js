import { money } from "../utils/helpers.js";

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
