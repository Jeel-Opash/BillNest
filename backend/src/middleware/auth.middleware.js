import jwt from "jsonwebtoken";
import ApiKey from "../models/apiKey.model.js";
import SettingsService from "../services/settings.service.js";

const authMiddleware = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
    const apiKey = req.headers["x-api-key"] || (bearerToken?.startsWith("saas_") ? bearerToken : "");
    if (apiKey) {
      const keyHash = SettingsService.hashKey(apiKey);
      const activeKey = await ApiKey.findOne({
        $or: [{ keyHash }, { key: apiKey }],
        isActive: true,
      });
      if (!activeKey) {
        return res.status(401).json({
          success: false,
          message: "Invalid or inactive API key",
        });
      }


      req.user = {
        organizationId: activeKey.organization.toString(),
        tenantId: activeKey.organization.toString(),
        role: "admin",
        isApiKey: true,
        apiKeyId: activeKey._id,
      };

      return next();
    }


    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No authentication credentials provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const User = (await import("../models/user.model.js")).default;
    const dbUser = await User.findById(decoded.userId).select("role clientAccess status");
    if (!dbUser || dbUser.status === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: User account is inactive or not found",
      });
    }

    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId || decoded.tenantId,
      tenantId: decoded.tenantId || decoded.organizationId,
      role: dbUser.role || decoded.role,
      clientAccess: dbUser.clientAccess || [],
      isApiKey: false,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Invalid or expired token",
    });
  }
};

export default authMiddleware;
