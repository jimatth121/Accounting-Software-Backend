import { Router } from "express";
import { now, uid } from "../utils/helpers.js";

const router = Router();

router.get("/", (req, res) => res.json(req.store.customers));

router.post("/", (req, res) => {
  const customer = { id: uid("cus"), openingBalance: 0, notes: "", ...req.body, createdAt: now(), updatedAt: now() };
  req.store.customers.push(customer);
  res.status(201).json(customer);
});

export default router;
