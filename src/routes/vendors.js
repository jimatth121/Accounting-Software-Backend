import { Router } from "express";
import { now, uid } from "../utils/helpers.js";
import { paginate } from "../utils/pagination.js";

const router = Router();

router.get("/", (req, res) =>
  res.json(paginate(req.store.vendors, req.query, ["name", "companyName", "email", "phone", "address", "taxId"]))
);

router.post("/", (req, res) => {
  const vendor = { id: uid("ven"), openingBalance: 0, notes: "", ...req.body, createdAt: now(), updatedAt: now() };
  req.store.vendors.push(vendor);
  res.status(201).json(vendor);
});

router.patch("/:id", (req, res) => {
  const store = req.store;
  const idx = store.vendors.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Vendor not found" });

  const { id, createdAt, ...patch } = req.body || {};
  store.vendors[idx] = { ...store.vendors[idx], ...patch, id: store.vendors[idx].id, updatedAt: now() };
  res.json(store.vendors[idx]);
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const before = store.vendors.length;
  store.vendors = store.vendors.filter((item) => item.id !== req.params.id);
  if (store.vendors.length === before) return res.status(404).json({ error: "Vendor not found" });
  res.json({ ok: true, id: req.params.id });
});

export default router;
