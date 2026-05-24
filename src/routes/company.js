import { Router } from "express";
import { now } from "../utils/helpers.js";

const router = Router();

router.patch("/", (req, res) => {
  req.store.company = { ...req.store.company, ...req.body, updatedAt: now() };
  res.json(req.store.company);
});

export default router;
