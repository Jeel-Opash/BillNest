import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  getOrganizationSettings,
  listTeamMembers,
  updateOrganizationSettings,
  removeTeamMember,
} from "../controllers/settings.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/organization", getOrganizationSettings);
router.put("/organization", roleMiddleware("owner", "admin"), updateOrganizationSettings);
router.get("/team", roleMiddleware("owner", "admin"), listTeamMembers);
router.delete("/team/:userId", roleMiddleware("owner", "admin"), removeTeamMember);

export default router;
