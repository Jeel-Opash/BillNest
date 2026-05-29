import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createPaymentSession,
  createSubscriptionCheckout,
  handleStripeWebhook,
} from "../controllers/stripe.controller.js";

const router = express.Router();


router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);


router.post(
  "/create-checkout-session",
  authMiddleware,
  createPaymentSession
);

router.post(
  "/create-subscription-session",
  authMiddleware,
  createSubscriptionCheckout
);

export default router;
