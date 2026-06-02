import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import Invitation from "../models/invitation.model.js";
import sendEmail from "../utils/sendEmail.js";

class AuthService {



  signAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        organizationId: user.organization._id || user.organization,
        tenantId: user.organization._id || user.organization,
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




  async registerTenant({ organizationName, name, email, password, role }) {
    if (!organizationName || !name || !email || !password) {
      throw new Error("All registration fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    let slug = organizationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      slug = `${slug}-${Date.now()}`;
    }

    const organization = await Organization.create({
      name: organizationName,
      slug,
      subscription: {
        plan: "free",
        status: "active",
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      organization: organization._id,
      name,
      email,
      password: hashedPassword,
      role: "owner",
      status: "active",
    });

    organization.owner = user._id;
    organization.userId = user._id;
    await organization.save();

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
      },
      organization,
    };
  }




  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).populate("organization");
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
        email: user.email,
        role: user.role,
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


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User is already registered");
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

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      organization: invitation.organization,
      name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
    });

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
