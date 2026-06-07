// Derives double-entry journal entries from invoices, expenses and payments
// against the user's chart of accounts.

const FALLBACKS = {
  bank: { code: "1000", name: "Bank Account", type: "Asset" },
  receivable: { code: "1100", name: "Accounts Receivable", type: "Asset" },
  payable: { code: "2000", name: "Accounts Payable", type: "Liability" },
  taxPayable: { code: "2100", name: "Sales Tax Payable", type: "Liability" },
  salesRevenue: { code: "4000", name: "Sales Revenue", type: "Income" },
  generalExpense: { code: "5000", name: "Operating Expenses", type: "Expense" }
};

function findAccount(accounts, predicate, fallback) {
  const hit = accounts.find(predicate);
  if (hit) return { id: hit.id || hit.code, code: hit.code, name: hit.name, type: hit.type };
  return { id: fallback.code, code: fallback.code, name: fallback.name, type: fallback.type };
}

function resolveAccounts(store) {
  const accounts = store.accounts || [];
  return {
    bank: findAccount(accounts, (a) => a.code === "1000" || /bank/i.test(a.name), FALLBACKS.bank),
    receivable: findAccount(accounts, (a) => a.code === "1100" || /receivable/i.test(a.name), FALLBACKS.receivable),
    payable: findAccount(accounts, (a) => a.code === "2000" || /payable/i.test(a.name), FALLBACKS.payable),
    taxPayable: findAccount(accounts, (a) => a.code === "2100" || /tax/i.test(a.name), FALLBACKS.taxPayable),
    salesRevenue: findAccount(accounts, (a) => a.code === "4000" || /revenue|sales/i.test(a.name), FALLBACKS.salesRevenue),
    generalExpense: findAccount(accounts, (a) => a.code === "5000" || /operating expense/i.test(a.name), FALLBACKS.generalExpense)
  };
}

function expenseAccountFor(category, accounts, generalExpense) {
  if (!category) return generalExpense;
  const lookup = String(category).toLowerCase();
  const match = accounts.find(
    (a) => a.type === "Expense" && (lookup.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(lookup))
  );
  if (match) return { id: match.id || match.code, code: match.code, name: match.name, type: match.type };
  return generalExpense;
}

function entry(transactionId, date, description, ref, debit, credit, account) {
  return {
    id: `${transactionId}__${account.code}__${debit > 0 ? "D" : "C"}`,
    transactionId,
    date,
    description,
    reference: ref || "",
    debit: Number(debit) || 0,
    credit: Number(credit) || 0,
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    accountType: account.type
  };
}

export function buildLedger(store) {
  const resolved = resolveAccounts(store);
  const accounts = store.accounts || [];
  const entries = [];

  // Invoices — record receivable when issued
  for (const invoice of store.invoices || []) {
    if (!invoice.issueDate) continue;
    const customer = (store.customers || []).find((c) => c.id === invoice.customerId);
    const desc = `Invoice ${invoice.invoiceNumber} — ${customer?.name || "customer"}`;
    const total = Number(invoice.totalAmount) || 0;
    const tax = Number(invoice.taxAmount) || 0;
    const net = Math.max(0, total - tax);
    entries.push(entry(invoice.id, invoice.issueDate, desc, invoice.invoiceNumber, total, 0, resolved.receivable));
    entries.push(entry(invoice.id, invoice.issueDate, desc, invoice.invoiceNumber, 0, net, resolved.salesRevenue));
    if (tax > 0) {
      entries.push(entry(`${invoice.id}_tax`, invoice.issueDate, `${desc} (tax)`, invoice.invoiceNumber, 0, tax, resolved.taxPayable));
    }
  }

  // Expenses — record expense + cash/bank out (if Paid) or payable (otherwise)
  for (const expense of store.expenses || []) {
    if (!expense.expenseDate) continue;
    const vendor = (store.vendors || []).find((v) => v.id === expense.vendorId);
    const desc = expense.description || `Expense — ${vendor?.name || expense.category || "vendor"}`;
    const amount = Number(expense.amount) || 0;
    const expenseAccount = expenseAccountFor(expense.category, accounts, resolved.generalExpense);
    entries.push(entry(expense.id, expense.expenseDate, desc, vendor?.name || "", amount, 0, expenseAccount));
    const isPaid = String(expense.status || "").toLowerCase() === "paid";
    const fundingAccount = isPaid ? resolved.bank : resolved.payable;
    entries.push(entry(expense.id, expense.expenseDate, desc, vendor?.name || "", 0, amount, fundingAccount));
  }

  // Payments — incoming clears receivable; outgoing clears payable (if linked) or expense (already booked)
  for (const payment of store.payments || []) {
    if (!payment.paymentDate) continue;
    const amount = Number(payment.amount) || 0;
    const incoming = payment.paymentType === "incoming";
    if (incoming) {
      const invoice = (store.invoices || []).find((inv) => inv.id === payment.invoiceId);
      const desc = invoice ? `Payment received — ${invoice.invoiceNumber}` : `Payment received — ${payment.reference || "general"}`;
      entries.push(entry(payment.id, payment.paymentDate, desc, payment.reference, amount, 0, resolved.bank));
      entries.push(entry(payment.id, payment.paymentDate, desc, payment.reference, 0, amount, resolved.receivable));
    } else {
      const expense = (store.expenses || []).find((e) => e.id === payment.expenseId);
      const vendor = (store.vendors || []).find((v) => v.id === payment.vendorId);
      const desc = expense?.description
        ? `Payment sent — ${expense.description}`
        : `Payment sent — ${vendor?.name || payment.reference || "general"}`;
      // Outgoing payment debits payable (clearing it) and credits bank
      entries.push(entry(payment.id, payment.paymentDate, desc, payment.reference, amount, 0, resolved.payable));
      entries.push(entry(payment.id, payment.paymentDate, desc, payment.reference, 0, amount, resolved.bank));
    }
  }

  return entries;
}

function inRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function ledger(store, filters = {}) {
  const all = buildLedger(store);
  const { accountId, accountCode, type, search, dateFrom, dateTo } = filters;
  const term = (search || "").trim().toLowerCase();

  const filtered = all.filter((row) => {
    if (accountId && row.accountId !== accountId && row.accountCode !== accountId) return false;
    if (accountCode && row.accountCode !== accountCode) return false;
    if (type && row.accountType !== type) return false;
    if (!inRange(row.date, dateFrom, dateTo)) return false;
    if (term) {
      const blob = `${row.description} ${row.reference} ${row.accountName} ${row.accountCode}`.toLowerCase();
      if (!blob.includes(term)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.accountCode.localeCompare(b.accountCode);
  });

  let runningBalance = 0;
  let totalDebits = 0;
  let totalCredits = 0;
  const withBalance = filtered.map((row) => {
    runningBalance += row.debit - row.credit;
    totalDebits += row.debit;
    totalCredits += row.credit;
    return { ...row, runningBalance };
  });

  return {
    entries: withBalance,
    summary: {
      totalDebits,
      totalCredits,
      netChange: totalDebits - totalCredits,
      entryCount: withBalance.length
    }
  };
}
