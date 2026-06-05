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
  getTeamMembers,
  updateRole,
  searchOrganizationsController,
  submitJoinRequestController,
  getMyJoinRequestsController,
  getPendingRequestsController,
  getRequestHistoryController,
  processJoinRequestController,
  getAccessCodeController,
  regenerateAccessCodeController,
  createOrganizationController,
  updateProfileController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  cancelJoinRequestController,
  getMe,
} from "../controllers/auth.controller.js";

const router = express.Router();


router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/accept-invite", acceptInvitation);
router.put("/update-role", authMiddleware, updateRole);
router.get("/me", authMiddleware, getMe);

router.post("/organization/create", authMiddleware, createOrganizationController);
router.put("/profile", authMiddleware, updateProfileController);
router.put("/change-password", authMiddleware, changePasswordController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.delete("/join-requests/:id", authMiddleware, cancelJoinRequestController);


router.post("/invite", authMiddleware, roleMiddleware("owner", "admin"), inviteTeammate);
router.get("/team/members", authMiddleware, getTeamMembers);


router.get("/organizations/search", authMiddleware, searchOrganizationsController);
router.post("/join-requests", authMiddleware, submitJoinRequestController);
router.get("/join-requests/my", authMiddleware, getMyJoinRequestsController);
router.get("/join-requests/pending", authMiddleware, roleMiddleware("owner", "admin"), getPendingRequestsController);
router.get("/join-requests/history", authMiddleware, roleMiddleware("owner", "admin"), getRequestHistoryController);
router.post("/join-requests/:id/action", authMiddleware, roleMiddleware("owner", "admin"), processJoinRequestController);
router.get("/organization/code", authMiddleware, roleMiddleware("owner", "admin"), getAccessCodeController);
router.post("/organization/regenerate-code", authMiddleware, roleMiddleware("owner", "admin"), regenerateAccessCodeController);

export default router;