import { Router } from "express";
import { dashboard, profitAndLoss } from "../services/reports.js";

const router = Router();

router.get("/dashboard", (req, res) => res.json(dashboard(req.store)));

router.get("/profit-and-loss", (req, res) => res.json(profitAndLoss(req.store)));

router.get("/expense-summary", (req, res) => res.json(dashboard(req.store).topExpenseCategories));

router.get("/customer-balances", (req, res) => {
  const store = req.store;
  const balances = store.customers.map((customer) => {
    const outstanding = store.invoices
      .filter((invoice) => invoice.customerId === customer.id)
      .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
    return { customerId: customer.id, name: customer.name, outstanding };
  });
  res.json(balances);
});

export default router;
