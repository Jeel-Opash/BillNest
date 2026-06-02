import crypto from "crypto";
import ApiKey from "../models/apiKey.model.js";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";

const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");
const randomToken = () => crypto.randomBytes(24).toString("base64url").slice(0, 32);

class SettingsService {
  async getOrganization(organizationId) {
    const organization = await Organization.findById(organizationId).select("-apiKeys.key");
    if (!organization) throw new Error("Organization not found");
    return organization;
  }

  async updateOrganization(organizationId, data) {
    const allowed = ["name", "currency", "country", "taxId", "logo", "settings"];
    const update = {};
    allowed.forEach((field) => {
      if (data[field] !== undefined) update[field] = data[field];
    });

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!organization) throw new Error("Organization not found");
    return organization;
  }

  async listTeam(organizationId) {
    return User.find({ organization: organizationId }).select("name email role status lastLogin createdAt").sort({ createdAt: 1 });
  }

  async generateApiKey(organizationId, name = "Default API key") {
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new Error("Organization not found");

    const plainKey = `saas_${organization.slug}_${randomToken()}`;
    const keyHash = hashKey(plainKey);
    const apiKey = await ApiKey.create({
      organization: organizationId,
      tenantId: organizationId,
      key: keyHash,
      keyHash,
      last4: plainKey.slice(-4),
      name,
      isActive: true,
    });

    return { apiKey, plainKey };
  }

  async listApiKeys(organizationId) {
    return ApiKey.find({ organization: organizationId }).select("name last4 isActive createdAt updatedAt");
  }

  async revokeApiKey(organizationId, id) {
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $set: { isActive: false, revokedAt: new Date() } },
      { new: true }
    );
    if (!apiKey) throw new Error("API key not found or access denied");
    return apiKey;
  }

  async removeTeammate(organizationId, targetUserId, requesterRole) {
    const targetUser = await User.findOne({ _id: targetUserId, organization: organizationId });
    if (!targetUser) throw new Error("Teammate not found");

    if (targetUser.role === "owner") {
      throw new Error("Access Denied: The Owner cannot be removed from the organization");
    }

    if (requesterRole === "admin" && targetUser.role === "admin") {
      throw new Error("Access Denied: Admins cannot remove other Admins");
    }

    await User.findByIdAndDelete(targetUserId);
    return targetUser;
  }

  hashKey(key) {
    return hashKey(key);
  }
}

export default new SettingsService();
