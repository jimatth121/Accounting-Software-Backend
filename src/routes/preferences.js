import { Router } from "express";
import { now } from "../utils/helpers.js";

const router = Router();

const DEFAULTS = {
  notifications: {
    invoiceReminders: true,
    paymentReceived: true,
    overdueAlerts: true,
    weeklyDigest: false,
    productUpdates: false,
    emailMarketing: false
  },
  theme: "light",
  language: "English",
  dateFormat: "DD MMM YYYY",
  autoBackup: true
};

function ensurePreferences(store) {
  if (!store.preferences) store.preferences = { ...DEFAULTS, updatedAt: now() };
  if (!store.preferences.notifications) store.preferences.notifications = { ...DEFAULTS.notifications };
  return store.preferences;
}

router.get("/", (req, res) => res.json(ensurePreferences(req.store)));

router.patch("/", (req, res) => {
  const prefs = ensurePreferences(req.store);
  const { notifications, ...rest } = req.body || {};
  Object.assign(prefs, rest);
  if (notifications) prefs.notifications = { ...prefs.notifications, ...notifications };
  prefs.updatedAt = now();
  res.json(prefs);
});

export default router;
