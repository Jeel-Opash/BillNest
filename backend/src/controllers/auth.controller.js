import AuthService from "../services/auth.service.js";
import AuditService from "../services/audit.service.js";
import ApiKey from "../models/apiKey.model.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const result = await AuthService.registerTenant(req.body);


    await AuditService.logAction(
      result.organization?._id || null,
      result.user._id,
      "TENANT_REGISTERED",
      { organizationName: result.organization?.name || "None" },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      organization: result.organization,
    });
  } catch (error) {
    console.error("Register Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);


    await AuditService.logAction(
      result.user.organization?._id || null,
      result.user._id,
      "USER_LOGIN",
      { email: result.user.email },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.rotateTokens(refreshToken);

    res.status(200).json({
      success: true,
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Refresh Controller Error:", error);
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const inviteTeammate = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (req.user.role === "admin" && (role === "owner" || role === "admin")) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Admins are not allowed to invite or assign Owner or Admin roles.",
      });
    }

    const invitation = await AuthService.inviteTeammate({
      email,
      role,
      invitedByUserId: req.user.userId,
      organizationId: req.user.organizationId,
    });


    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId,
      "TEAM_MEMBER_INVITED",
      { inviteeEmail: email, role },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Teammate invited successfully",
      invitation,
    });
  } catch (error) {
    console.error("Invite Teammate Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    const result = await AuthService.acceptInvitation({ token, name, password });


    await AuditService.logAction(
      result.user.organization,
      result.user._id,
      "INVITATION_ACCEPTED",
      { name: result.user.name, email: result.user.email },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Invitation accepted and account setup successful",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    console.error("Accept Invitation Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};


export const createApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "API key name is required" });
    }

    const key = `bn_${crypto.randomBytes(24).toString("hex")}`;
    const apiKey = await ApiKey.create({
      organization: req.user.organizationId,
      key,
      name,
    });


    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId,
      "API_KEY_CREATED",
      { name },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "API key created successfully",
      apiKey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ organization: req.user.organizationId });
    res.status(200).json({ success: true, keys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = await ApiKey.findOneAndDelete({ _id: id, organization: req.user.organizationId });
    if (!apiKey) {
      return res.status(404).json({ success: false, message: "API Key not found" });
    }


    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId,
      "API_KEY_DELETED",
      { name: apiKey.name },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({ success: true, message: "API key revoked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditService.getAuditLogs(req.user.organizationId, req.query);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const members = await AuthService.getTeamMembers(req.user.organizationId);
    res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Get Team Members Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: "Role is required" });
    }
    const result = await AuthService.updateUserRole(req.user.userId, role);
    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: result.user,
      token: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchOrganizationsController = async (req, res) => {
  try {
    const orgs = await AuthService.searchOrganizations(req.query.query);
    res.status(200).json({ success: true, organizations: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitJoinRequestController = async (req, res) => {
  try {
    const request = await AuthService.submitJoinRequest(req.user.userId, req.body);
    res.status(201).json({ success: true, message: "Join request submitted successfully.", request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyJoinRequestsController = async (req, res) => {
  try {
    const requests = await AuthService.getMyJoinRequests(req.user.userId);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingRequestsController = async (req, res) => {
  try {
    const requests = await AuthService.getPendingRequestsForOrg(req.user.organizationId);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequestHistoryController = async (req, res) => {
  try {
    const requests = await AuthService.getRequestHistoryForOrg(req.user.organizationId);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processJoinRequestController = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, finalRole, notes } = req.body;
    const request = await AuthService.processJoinRequest(id, req.user.userId, { action, finalRole, notes });

    // Audit Logging
    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId,
      action === "approved" ? "JOIN_REQUEST_APPROVED" : "JOIN_REQUEST_REJECTED",
      { requestId: id, assignedRole: finalRole || request.role, notes },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({ success: true, message: `Join request ${action} successfully.`, request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAccessCodeController = async (req, res) => {
  try {
    const Organization = (await import("../models/organization.model.js")).default;
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    // Auto-generate if not set
    if (!org.accessCode) {
      org.accessCode = "ORG-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      await org.save();
    }
    res.status(200).json({ success: true, accessCode: org.accessCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const regenerateAccessCodeController = async (req, res) => {
  try {
    const accessCode = await AuthService.regenerateAccessCode(req.user.organizationId);
    // Audit log
    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId,
      "ORGANIZATION_CODE_REGENERATED",
      { newCode: accessCode },
      req.ip,
      req.headers["user-agent"]
    );
    res.status(200).json({ success: true, message: "Access code regenerated successfully.", accessCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrganizationController = async (req, res) => {
  try {
    const result = await AuthService.createOrganization(req.user.userId, req.body);
    await AuditService.logAction(
      result.organization._id,
      req.user.userId,
      "ORGANIZATION_CREATED",
      { name: result.organization.name },
      req.ip,
      req.headers["user-agent"]
    );
    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      organization: result.organization,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const user = await AuthService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePasswordController = async (req, res) => {
  try {
    const result = await AuthService.changePassword(req.user.userId, req.body);
    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: result.message,
      resetToken: result.resetToken
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelJoinRequestController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AuthService.cancelJoinRequest(id, req.user.userId);
    res.status(200).json({ success: true, message: "Join request cancelled successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};