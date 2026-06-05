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
  sendInvoice,
  voidInvoice,
  markInvoicePaid,
  deleteInvoice,
  sendInvoiceEmailDirect,
} from "../controllers/invoice.controller.js";

const router = express.Router();


router.use(authMiddleware);

router.post("/", roleMiddleware("owner", "admin", "member"), createInvoice);
router.get("/", getInvoices);


router.get("/export", exportReport);

router.get("/:id", getInvoiceById);
router.put("/:id", roleMiddleware("owner", "admin", "member"), updateInvoice);
router.patch("/:id/status", roleMiddleware("owner", "admin", "member"), transitionInvoice);
router.post("/:id/send", roleMiddleware("owner", "admin", "member"), sendInvoice);
router.post("/:id/void", roleMiddleware("owner", "admin"), voidInvoice);
router.post("/:id/mark-paid", roleMiddleware("owner", "admin", "member"), markInvoicePaid);
router.delete("/:id", roleMiddleware("owner", "admin"), deleteInvoice);

router.get("/:id/pdf", downloadInvoicePdf);
router.post("/:id/send-email", roleMiddleware("owner", "admin", "member"), sendInvoiceEmail);
router.post("/send-email-direct", roleMiddleware("owner", "admin", "member"), sendInvoiceEmailDirect);

export default router;
