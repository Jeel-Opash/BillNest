import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientInvoices,
  getClientSubscriptions,
} from "../controllers/client.controller.js";

const router = express.Router();


router.use(authMiddleware);

router.post("/", roleMiddleware("owner", "admin", "member"), createClient);
router.get("/", getClients);
router.get("/:id/invoices", getClientInvoices);
router.get("/:id/subscriptions", getClientSubscriptions);
router.get("/:id", getClientById);
router.put("/:id", roleMiddleware("owner", "admin", "member"), updateClient);
router.delete("/:id", roleMiddleware("owner", "admin"), deleteClient);

export default router;
