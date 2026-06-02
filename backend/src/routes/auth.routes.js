import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middlware.js";
import {
  register,
  login,
  refresh,
  logout,
  inviteTeammate,
  acceptInvitation,
  createApiKey,
  getApiKeys,
  deleteApiKey,
  getAuditLogs,
  getTeamMembers,
  updateRole,
} from "../controllers/auth.controller.js";

const router = express.Router();


router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/accept-invite", acceptInvitation);
router.put("/update-role", authMiddleware, updateRole);


router.post("/invite", authMiddleware, roleMiddleware("owner", "admin"), inviteTeammate);
router.get("/audit-logs", authMiddleware, roleMiddleware("owner", "admin"), getAuditLogs);
router.get("/team/members", authMiddleware, getTeamMembers);


router.post("/api-keys", authMiddleware, roleMiddleware("owner", "admin"), createApiKey);
router.get("/api-keys", authMiddleware, roleMiddleware("owner", "admin"), getApiKeys);
router.delete("/api-keys/:id", authMiddleware, roleMiddleware("owner", "admin"), deleteApiKey);

export default router;