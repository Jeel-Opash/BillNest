import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  generateApiKey,
  getOrganizationSettings,
  listApiKeys,
  listTeamMembers,
  revokeApiKey,
  updateOrganizationSettings,
  removeTeamMember,
} from "../controllers/settings.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/organization", getOrganizationSettings);
router.put("/organization", roleMiddleware("owner", "admin"), updateOrganizationSettings);
router.get("/team", roleMiddleware("owner", "admin"), listTeamMembers);
router.delete("/team/:userId", roleMiddleware("owner", "admin"), removeTeamMember);
router.get("/api-keys", roleMiddleware("owner", "admin"), listApiKeys);
router.post("/api-keys", roleMiddleware("owner", "admin"), generateApiKey);
router.delete("/api-keys/:id", roleMiddleware("owner", "admin"), revokeApiKey);

export default router;
