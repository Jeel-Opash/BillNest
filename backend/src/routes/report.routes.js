import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getInvoiceReport, getRevenueReport, getSubscriptionReport } from "../controllers/report.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/invoices", getInvoiceReport);
router.get("/revenue", getRevenueReport);
router.get("/subscriptions", getSubscriptionReport);

export default router;
