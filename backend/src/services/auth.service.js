import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import Invitation from "../models/invitation.model.js";
import sendEmail from "../utils/sendEmail.js";
import JoinRequest from "../models/joinRequest.model.js";

class AuthService {



  signAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        organizationId: user.organization?._id || user.organization || null,
        tenantId: user.organization?._id || user.organization || null,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  }




  signRefreshToken(user) {
    return jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }




  async registerTenant({ organizationName, name, username, email, password, phone, avatar, role }) {
    if (!name || !email || !password) {
      throw new Error("Name, email and password are required");
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new Error("User with this email already exists");
    }

    if (username) {
      const existingUserByUsername = await User.findOne({ username });
      if (existingUserByUsername) {
        throw new Error("User with this username already exists");
      }
    }

    let organization = null;
    let finalRole = role || "member";

    if (organizationName) {
      let slug = organizationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        slug = `${slug}-${Date.now()}`;
      }

      const accessCode = crypto.randomBytes(4).toString("hex").toUpperCase();

      organization = await Organization.create({
        name: organizationName,
        slug,
        accessCode,
        subscription: {
          plan: "free",
          status: "active",
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      finalRole = "owner";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      organization: organization ? organization._id : undefined,
      name,
      username: username || email.split("@")[0] + Math.floor(100 + Math.random() * 900),
      email,
      password: hashedPassword,
      phone: phone || "",
      avatar: avatar || "",
      role: finalRole,
      status: "active",
    });

    if (organization) {
      organization.owner = user._id;
      organization.userId = user._id;
      await organization.save();
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        organization: user.organization,
      },
      organization,
    };
  }




  async login({ email, username, password }) {
    const identifier = email || username;
    if (!identifier || !password) {
      throw new Error("Email/username and password are required");
    }

    const query = email 
      ? { email } 
      : username 
      ? { username } 
      : { $or: [{ email: identifier }, { username: identifier }] };

    const user = await User.findOne(query).populate("organization");
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    user.lastLogin = new Date();
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        organization: user.organization,
      },
    };
  }




  async rotateTokens(receivedRefreshToken) {
    if (!receivedRefreshToken) {
      throw new Error("Refresh token is required");
    }


    let decoded;
    try {
      decoded = jwt.verify(receivedRefreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      throw new Error("Invalid refresh token");
    }

    const user = await User.findById(decoded.userId).populate("organization");
    if (!user) {
      throw new Error("User not found");
    }


    if (!user.refreshTokens.includes(receivedRefreshToken)) {


      user.refreshTokens = [];
      await user.save();
      throw new Error("Security alert: Refresh token reuse detected. Log in again.");
    }


    user.refreshTokens = user.refreshTokens.filter(t => t !== receivedRefreshToken);

    const newAccessToken = this.signAccessToken(user);
    const newRefreshToken = this.signRefreshToken(user);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }




  async inviteTeammate({ email, role, invitedByUserId, organizationId }) {
    if (!email || !role) {
      throw new Error("Email and role are required");
    }

    const existingInvite = await Invitation.findOne({ organization: organizationId, email, status: "pending" });
    if (existingInvite) {
      throw new Error("An invitation is already pending for this email");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      organization: organizationId,
      email,
      role,
      token,
      invitedBy: invitedByUserId,
      expiresAt,
    });

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${token}`;


    try {
      await sendEmail({
        to: email,
        subject: "You've been invited to join BillNest workspace",
        text: `You have been invited to join the BillNest workspace as an ${role}.\n\nClick the link below to accept the invitation and set up your account:\n\n${inviteLink}\n\nThis invitation will expire in 48 hours.`,
      });
    } catch (err) {
      console.error("Failed to send invitation email:", err);

    }

    return invitation;
  }




  async acceptInvitation({ token, name, password }) {
    if (!token || !name || !password) {
      throw new Error("Token, name, and password are required");
    }

    const invitation = await Invitation.findOne({ token, status: "pending" });
    if (!invitation) {
      throw new Error("Invalid or already accepted invitation token");
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      throw new Error("Invitation token has expired");
    }

    let user = await User.findOne({ email: invitation.email });
    if (user) {
      user.organization = invitation.organization;
      user.role = invitation.role;
      if (name) user.name = name;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        organization: invitation.organization,
        name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
      });
    }

    invitation.status = "accepted";
    await invitation.save();

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: invitation.organization,
      },
    };
  }




  async updateUserRole(userId, role) {
    const user = await User.findById(userId).populate("organization");
    if (!user) {
      throw new Error("User not found");
    }
    user.role = role;
    await user.save();
    
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    
    user.refreshTokens.push(refreshToken);
    await user.save();
    
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      },
      accessToken,
      refreshToken
    };
  }

  async getTeamMembers(organizationId) {
    return await User.find({ organization: organizationId })
      .select("name email role status lastLoginAt lastLogin")
      .sort({ createdAt: 1 });
  }




  async searchOrganizations(query) {
    if (!query) return [];
    return await Organization.find({
      name: { $regex: query, $options: "i" },
      isActive: true
    }).select("name slug logo");
  }

  async submitJoinRequest(userId, { organizationId, accessCode, role, message }) {
    if (!role) throw new Error("Role is required");
    
    let org;
    if (accessCode) {
      org = await Organization.findOne({ accessCode: accessCode.trim().toUpperCase(), isActive: true });
      if (!org) throw new Error("Invalid organization access code.");
    } else if (organizationId) {
      org = await Organization.findOne({ _id: organizationId, isActive: true });
      if (!org) throw new Error("Organization not found.");
    } else {
      throw new Error("Either organizationId or accessCode is required.");
    }

    const existingPending = await JoinRequest.findOne({
      organization: org._id,
      user: userId,
      status: "pending"
    });
    if (existingPending) {
      throw new Error("You already have a pending join request for this organization.");
    }

    return await JoinRequest.create({
      organization: org._id,
      user: userId,
      role,
      message: message || ""
    });
  }

  async cancelJoinRequest(requestId, userId) {
    const request = await JoinRequest.findOne({ _id: requestId, user: userId, status: "pending" });
    if (!request) {
      throw new Error("Pending Join Request not found or already processed.");
    }
    await JoinRequest.deleteOne({ _id: requestId });
    return { success: true };
  }

  async getMyJoinRequests(userId) {
    return await JoinRequest.find({ user: userId })
      .populate("organization", "name slug logo settings accessCode")
      .sort({ createdAt: -1 });
  }

  async getPendingRequestsForOrg(organizationId) {
    return await JoinRequest.find({ organization: organizationId, status: "pending" })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });
  }

  async getRequestHistoryForOrg(organizationId) {
    return await JoinRequest.find({ organization: organizationId, status: { $ne: "pending" } })
      .populate("user", "name email avatar")
      .populate("approvalHistory.actedBy", "name email")
      .sort({ updatedAt: -1 });
  }

  async processJoinRequest(requestId, actedByUserId, { action, finalRole, notes }) {
    if (!["approved", "rejected"].includes(action)) {
      throw new Error("Invalid action. Must be approved or rejected.");
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) throw new Error("Join Request not found.");
    if (request.status !== "pending") throw new Error("Request already processed.");

    request.status = action;
    request.approvalHistory.push({
      action,
      actedBy: actedByUserId,
      notes: notes || "",
      timestamp: new Date()
    });

    await request.save();

    if (action === "approved") {
      const assignedRole = finalRole || request.role;
      const targetUser = await User.findById(request.user);
      if (targetUser) {
        targetUser.organization = request.organization;
        targetUser.tenantId = request.organization;
        targetUser.role = assignedRole;
        targetUser.status = "active";
        await targetUser.save();
      }
    }

    return request;
  }

  async regenerateAccessCode(organizationId) {
    const newCode = "ORG-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const org = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: { accessCode: newCode } },
      { new: true }
    );
    if (!org) throw new Error("Organization not found.");
    return org.accessCode;
  }

  async createOrganization(userId, { name, industry, businessType, country, currency, timezone }) {
    if (!name) {
      throw new Error("Organization Name is required");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      slug = `${slug}-${Date.now()}`;
    }

    const accessCode = "ORG-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    const organization = await Organization.create({
      name,
      slug,
      accessCode,
      industry: industry || "Technology",
      businessType: businessType || "SaaS",
      country: country || "India",
      currency: currency || "INR",
      timezone: timezone || "Asia/Kolkata",
      userId: user._id,
      owner: user._id,
      subscription: {
        plan: "free",
        status: "active",
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    user.role = "owner";
    user.organization = organization._id;
    user.tenantId = organization._id;
    user.status = "active";
    await user.save();

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        organization: organization,
      },
      organization
    };
  }

  async updateProfile(userId, { name, username, email, phone, avatar }) {
    const user = await User.findById(userId).populate("organization");
    if (!user) {
      throw new Error("User not found");
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await User.findOne({ email });
      if (existing) throw new Error("Email is already taken");
      user.email = email;
    }

    if (username && username.toLowerCase() !== user.username?.toLowerCase()) {
      const existing = await User.findOne({ username });
      if (existing) throw new Error("Username is already taken");
      user.username = username;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return user;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { success: true };
  }

  async forgotPassword(email) {
    if (!email) throw new Error("Email is required");
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User with this email not found");
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    return {
      success: true,
      message: "Reset token generated successfully (Simulated Email Sent)",
      resetToken: token
    };
  }

  async resetPassword(token, newPassword) {
    if (!token || !newPassword) throw new Error("Token and new password are required");

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error("Password reset token is invalid or has expired");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { success: true, message: "Password updated successfully" };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await User.updateOne(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    }
  }
}

export default new AuthService();
