import cors from "cors";
import express from "express";
import morgan from "morgan";

import { userContext } from "./middleware/userContext.js";

import demoRoutes from "./routes/demo.js";
import metaRoutes from "./routes/meta.js";
import accountRoutes from "./routes/account.js";
import companyRoutes from "./routes/company.js";
import customersRoutes from "./routes/customers.js";
import vendorsRoutes from "./routes/vendors.js";
import invoicesRoutes from "./routes/invoices.js";
import expensesRoutes from "./routes/expenses.js";
import paymentsRoutes from "./routes/payments.js";
import reportsRoutes from "./routes/reports.js";
import aiRoutes from "./routes/ai.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-profile"]
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Public routes (no user context required)
app.get("/", (req, res) => res.json({ name: "SmartBooks AI API", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));
app.use("/api/demo", demoRoutes);

// Everything under /api requires a user context (Clerk userId via x-user-id header)
app.use("/api", userContext);

app.use("/api/account", accountRoutes);
app.use("/api/bootstrap", metaRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/vendors", vendorsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/ai", aiRoutes);

export default app;
