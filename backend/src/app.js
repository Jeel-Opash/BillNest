import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import tenantRateLimiter from "./middleware/rateLimit.middleware.js";

const app = express();

const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 150,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(baseLimiter);

app.use("/api/stripe", stripeRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", tenantRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred",
  });
});

export default app;
