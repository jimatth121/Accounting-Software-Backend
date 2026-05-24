import { Router } from "express";

const router = Router();

// Returns the current user's company profile. The userContext middleware
// will lazy-create the account with seed data if this is the first request.
router.get("/", (req, res) => {
  res.json({
    userId: req.userId,
    company: req.store.company,
    seeded: true
  });
});

export default router;
