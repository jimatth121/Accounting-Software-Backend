import { Router } from "express";
import { ledger } from "../services/ledger.js";

const router = Router();

router.get("/", (req, res) => {
  const filters = {
    accountId: req.query.accountId,
    accountCode: req.query.accountCode,
    type: req.query.type,
    search: req.query.search,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo
  };
  res.json(ledger(req.store, filters));
});

router.get("/accounts", (req, res) => {
  const accounts = (req.store.accounts || []).map((a) => ({
    id: a.id || a.code,
    code: a.code,
    name: a.name,
    type: a.type,
    subtype: a.subtype || ""
  }));
  res.json(accounts);
});

export default router;
