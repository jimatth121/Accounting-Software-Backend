import { Router } from "express";
import { now, uid } from "../utils/helpers.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.customers));

router.post("/", (req, res) => {
  const customer = { id: uid("cus"), openingBalance: 0, notes: "", ...req.body, createdAt: now(), updatedAt: now() };
  req.store.customers.push(customer);
  res.status(201).json(customer);
});

router.patch("/:id", (req, res) => {
  const store = req.store;
  const idx = store.customers.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Customer not found" });

  const { id, createdAt, ...patch } = req.body || {};
  store.customers[idx] = { ...store.customers[idx], ...patch, id: store.customers[idx].id, updatedAt: now() };
  res.json(store.customers[idx]);
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const before = store.customers.length;
  store.customers = store.customers.filter((item) => item.id !== req.params.id);
  if (store.customers.length === before) return res.status(404).json({ error: "Customer not found" });
  res.json({ ok: true, id: req.params.id });
});

export default router;
