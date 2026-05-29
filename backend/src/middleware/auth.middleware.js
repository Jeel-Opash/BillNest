import jwt from "jsonwebtoken";
import ApiKey from "../models/apiKey.model.js";

const authMiddleware = async (req, res, next) => {
  try {

    const apiKey = req.headers["x-api-key"];
    if (apiKey) {
      const activeKey = await ApiKey.findOne({ key: apiKey, isActive: true });
      if (!activeKey) {
        return res.status(401).json({
          success: false,
          message: "Invalid or inactive API key",
        });
      }


      req.user = {
        organizationId: activeKey.organization.toString(),
        role: "admin",
        isApiKey: true,
      };

      return next();
    }


    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No authentication credentials provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
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