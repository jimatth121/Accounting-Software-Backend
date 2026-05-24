import { Router } from "express";
import { now, today } from "../utils/helpers.js";
import { dashboard } from "../services/reports.js";
import { detectAnomalies } from "../services/anomalies.js";

const router = Router();

router.post("/extract-document", (req, res) => {
  const store = req.store;
  const fileName = req.body.fileName || "receipt-upload.png";
  const vendor = store.vendors.find((item) => fileName.toLowerCase().includes(item.name.toLowerCase())) || store.vendors[0];
  const category = fileName.toLowerCase().includes("uber") ? "Transport" : "Software/Hosting";

  res.json({
    extractionStatus: "review_required",
    message: "AI extraction is simulated for the MVP. Review before saving.",
    extractedData: {
      vendorId: vendor?.id,
      vendorName: vendor?.name,
      date: today(),
      totalAmount: fileName.toLowerCase().includes("uber") ? 12500 : 72500,
      taxAmount: 0,
      currency: store.company.defaultCurrency,
      categorySuggestion: category,
      paymentMethod: "Card",
      receiptNumber: `RCT-${Math.floor(Math.random() * 90000) + 10000}`,
      items: [{ description: "Extracted line item", amount: fileName.toLowerCase().includes("uber") ? 12500 : 72500 }]
    }
  });
});

router.post("/chat", (req, res) => {
  const store = req.store;
  const question = String(req.body.question || "").toLowerCase();
  const summary = dashboard(store);
  let answer = `Based on the records currently in SmartBooks AI, revenue is ${summary.currency} ${summary.totalRevenue.toLocaleString()}, expenses are ${summary.currency} ${summary.totalExpenses.toLocaleString()}, and estimated profit is ${summary.currency} ${summary.netProfit.toLocaleString()}.`;

  if (question.includes("owe") || question.includes("outstanding") || question.includes("overdue")) {
    answer = `Customers currently owe ${summary.currency} ${summary.outstandingInvoices.toLocaleString()}. There ${summary.overdueInvoices === 1 ? "is" : "are"} ${summary.overdueInvoices} overdue invoice${summary.overdueInvoices === 1 ? "" : "s"}.`;
  }

  if (question.includes("expense") || question.includes("spend")) {
    const top = summary.topExpenseCategories[0];
    answer = top
      ? `Your largest expense category is ${top.name} at ${summary.currency} ${top.amount.toLocaleString()}. Total recorded expenses are ${summary.currency} ${summary.totalExpenses.toLocaleString()}.`
      : "No expenses have been recorded yet.";
  }

  res.json({
    answer,
    sources: ["invoices", "expenses", "payments"],
    generatedAt: now()
  });
});

router.post("/detect-anomalies", (req, res) => res.json(detectAnomalies(req.store)));

export default router;
