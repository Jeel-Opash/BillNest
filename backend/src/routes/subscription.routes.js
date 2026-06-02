import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  getSubscriptionInfo,
  listSubscriptions,
  pauseSubscription,
  resumeSubscription,
  triggerAutoInvoiceRun,
  triggerDunningRun,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/plan", getSubscriptionInfo);
router.get("/", listSubscriptions);
router.post("/", roleMiddleware("owner", "admin"), createSubscription);
router.get("/:id", getSubscription);
router.post("/:id/cancel", roleMiddleware("owner", "admin"), cancelSubscription);
router.post("/:id/pause", roleMiddleware("owner", "admin"), pauseSubscription);
router.post("/:id/resume", roleMiddleware("owner", "admin"), resumeSubscription);
router.post("/trigger-auto-invoicing", roleMiddleware("owner", "admin"), triggerAutoInvoiceRun);
router.post(
  "/trigger-dunning",
  roleMiddleware("owner", "admin"),
  triggerDunningRun
);

export default router;
