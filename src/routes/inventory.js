import { Router } from "express";
import { money, now, uid } from "../utils/helpers.js";
import { paginate } from "../utils/pagination.js";

const router = Router();

function ensureList(store) {
  if (!Array.isArray(store.inventory)) store.inventory = [];
  return store.inventory;
}

router.get("/", (req, res) => {
  const { category, stock } = req.query;
  let rows = ensureList(req.store);
  if (category) rows = rows.filter((row) => row.category === category);
  if (stock === "low") rows = rows.filter((row) => row.quantity <= row.reorderLevel);
  else if (stock === "out") rows = rows.filter((row) => row.quantity <= 0);
  else if (stock === "ok") rows = rows.filter((row) => row.quantity > row.reorderLevel);
  res.json(paginate(rows, req.query, ["sku", "name", "category"]));
});

router.post("/", (req, res) => {
  const store = req.store;
  const list = ensureList(store);
  const item = {
    id: uid("itm"),
    sku: req.body.sku || `SKU-${Math.floor(Math.random() * 9000) + 1000}`,
    name: req.body.name || "Unnamed item",
    category: req.body.category || "General",
    quantity: Number(req.body.quantity) || 0,
    reorderLevel: Number(req.body.reorderLevel) || 0,
    unitCost: money(req.body.unitCost),
    unitPrice: money(req.body.unitPrice),
    createdAt: now(),
    updatedAt: now()
  };
  list.push(item);
  res.status(201).json(item);
});

router.patch("/:id", (req, res) => {
  const list = ensureList(req.store);
  const idx = list.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Inventory item not found" });

  const current = list[idx];
  const { id, createdAt, ...patch } = req.body || {};
  const updated = {
    ...current,
    ...patch,
    id: current.id,
    quantity: patch.quantity != null ? Math.max(0, Number(patch.quantity) || 0) : current.quantity,
    reorderLevel: patch.reorderLevel != null ? Math.max(0, Number(patch.reorderLevel) || 0) : current.reorderLevel,
    unitCost: patch.unitCost != null ? money(patch.unitCost) : current.unitCost,
    unitPrice: patch.unitPrice != null ? money(patch.unitPrice) : current.unitPrice,
    updatedAt: now()
  };
  list[idx] = updated;
  res.json(updated);
});

router.post("/:id/adjust", (req, res) => {
  const list = ensureList(req.store);
  const item = list.find((entry) => entry.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Inventory item not found" });

  const delta = Number(req.body.delta) || 0;
  item.quantity = Math.max(0, item.quantity + delta);
  item.updatedAt = now();
  res.json(item);
});

router.delete("/:id", (req, res) => {
  const store = req.store;
  const list = ensureList(store);
  const before = list.length;
  store.inventory = list.filter((item) => item.id !== req.params.id);
  if (store.inventory.length === before) return res.status(404).json({ error: "Inventory item not found" });
  res.json({ ok: true, id: req.params.id });
});

export default router;
