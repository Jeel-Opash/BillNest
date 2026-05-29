import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  getSubscriptionInfo,
  triggerDunningRun,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/plan", getSubscriptionInfo);
router.post(
  "/trigger-dunning",
  roleMiddleware("owner", "admin"),
  triggerDunningRun
);

export default router;
