import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import { archivePlan, createPlan, listPlans, updatePlan } from "../controllers/plan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listPlans);
router.post("/", roleMiddleware("owner", "admin"), createPlan);
router.put("/:id", roleMiddleware("owner", "admin"), updatePlan);
router.delete("/:id", roleMiddleware("owner", "admin"), archivePlan);

export default router;
