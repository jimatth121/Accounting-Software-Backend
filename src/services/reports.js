import { now } from "../utils/helpers.js";
import { enrichInvoice } from "./invoices.js";
import { enrichExpense } from "./expenses.js";

export function dashboard(store) {
  const invoices = store.invoices.map((invoice) => enrichInvoice(store, invoice));
  const expenses = store.expenses.map((expense) => enrichExpense(store, expense));
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const cashReceived = store.payments
    .filter((payment) => payment.paymentType === "incoming")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const outstandingInvoices = invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "Overdue").length;
  const expenseByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
  const customerTotals = invoices.reduce((acc, invoice) => {
    acc[invoice.customerName] = (acc[invoice.customerName] || 0) + invoice.totalAmount;
    return acc;
  }, {});

  return {
    currency: store.company.defaultCurrency,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    outstandingInvoices,
    overdueInvoices,
    cashReceived,
    topCustomers: Object.entries(customerTotals).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    topExpenseCategories: Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    recentInvoices: invoices.slice(-5).reverse(),
    recentExpenses: expenses.slice(-5).reverse()
  };
}

export function profitAndLoss(store) {
  const summary = dashboard(store);
  return {
    currency: summary.currency,
    income: summary.totalRevenue,
    expenses: summary.totalExpenses,
    netProfit: summary.netProfit,
    generatedAt: now()
  };
}
