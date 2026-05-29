import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller.js";

const router = express.Router();


router.use(authMiddleware);

router.post("/", createClient);
router.get("/", getClients);
router.get("/:id", getClientById);
router.put("/:id", roleMiddleware("owner", "admin", "member"), updateClient);
router.delete("/:id", roleMiddleware("owner", "admin"), deleteClient);

export default router;