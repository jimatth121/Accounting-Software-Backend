import { Router } from "express";
import { now, uid } from "../utils/helpers.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.vendors));

router.post("/", (req, res) => {
  const vendor = { id: uid("ven"), openingBalance: 0, notes: "", ...req.body, createdAt: now(), updatedAt: now() };
  req.store.vendors.push(vendor);
  res.status(201).json(vendor);
});

export default router;
