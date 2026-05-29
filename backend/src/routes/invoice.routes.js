import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  transitionInvoice,
  downloadInvoicePdf,
  sendInvoiceEmail,
  exportReport,
} from "../controllers/invoice.controller.js";

const router = express.Router();


router.use(authMiddleware);

router.post("/", roleMiddleware("owner", "admin", "member"), createInvoice);
router.get("/", getInvoices);


router.get("/export", exportReport);

router.get("/:id", getInvoiceById);
router.put("/:id", roleMiddleware("owner", "admin", "member"), updateInvoice);
router.patch("/:id/status", roleMiddleware("owner", "admin", "member"), transitionInvoice);

router.get("/:id/pdf", downloadInvoicePdf);
router.post("/:id/send-email", roleMiddleware("owner", "admin", "member"), sendInvoiceEmail);

export default router;