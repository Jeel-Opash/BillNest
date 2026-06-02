import SettingsService from "../services/settings.service.js";
import AuditService from "../services/audit.service.js";

export const getOrganizationSettings = async (req, res) => {
  try {
    const organization = await SettingsService.getOrganization(req.user.organizationId);
    res.json({ success: true, organization });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateOrganizationSettings = async (req, res) => {
  try {
    const organization = await SettingsService.updateOrganization(req.user.organizationId, req.body);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "ORG_SETTINGS_UPDATED", {}, req.ip, req.headers["user-agent"]);
    res.json({ success: true, organization });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listTeamMembers = async (req, res) => {
  try {
    const members = await SettingsService.listTeam(req.user.organizationId);
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const { apiKey, plainKey } = await SettingsService.generateApiKey(req.user.organizationId, req.body.name);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "API_KEY_CREATED", { keyId: apiKey._id, name: apiKey.name }, req.ip, req.headers["user-agent"]);
    res.status(201).json({ success: true, apiKey: { id: apiKey._id, name: apiKey.name, last4: apiKey.last4 }, plainKey });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listApiKeys = async (req, res) => {
  try {
    const apiKeys = await SettingsService.listApiKeys(req.user.organizationId);
    res.json({ success: true, apiKeys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeApiKey = async (req, res) => {
  try {
    const apiKey = await SettingsService.revokeApiKey(req.user.organizationId, req.params.id);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "API_KEY_REVOKED", { keyId: apiKey._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, apiKey });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const removedUser = await SettingsService.removeTeammate(
      req.user.organizationId,
      req.params.userId,
      req.user.role
    );
    await AuditService.logAction(
      req.user.organizationId,
      req.user.userId || "system",
      "TEAM_MEMBER_REMOVED",
      { removedUserEmail: removedUser.email, role: removedUser.role },
      req.ip,
      req.headers["user-agent"]
    );
    res.json({ success: true, message: "Teammate removed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
