import { enrichInvoice } from "./invoices.js";

export function detectAnomalies(store) {
  const anomalies = [];
  const invoices = store.invoices.map((invoice) => enrichInvoice(store, invoice));

  invoices.forEach((invoice) => {
    if (invoice.status === "Overdue") {
      anomalies.push({
        id: `anomaly_${invoice.id}`,
        severity: "high",
        title: `${invoice.invoiceNumber} is overdue`,
        detail: `${invoice.customerName} still owes ${invoice.currency} ${invoice.balanceDue.toLocaleString()}.`
      });
    }
  });

  store.expenses.forEach((expense) => {
    const peers = store.expenses.filter((item) => item.category === expense.category && item.id !== expense.id);
    const average = peers.reduce((sum, item) => sum + item.amount, 0) / Math.max(peers.length, 1);
    if (peers.length > 0 && expense.amount > average * 3) {
      anomalies.push({
        id: `anomaly_${expense.id}`,
        severity: "medium",
        title: `${expense.category} spend looks unusual`,
        detail: `${expense.description} is more than 3x the category average.`
      });
    }
  });

  return anomalies;
}
