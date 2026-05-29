import rateLimit from "express-rate-limit";


const tenantRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {

    if (process.env.NODE_ENV !== "production" || req.ip === "::1" || req.ip === "127.0.0.1") {
      return 10000;
    }

    if (req.user && req.user.isApiKey) {
      return 100;
    }
    return 60; 
  },
  keyGenerator: (req) => {
    if (req.user && req.user.organizationId) {
      return `tenant_${req.user.organizationId}`;
    }
    return req.ip;
  },
  message: {
    success: false,
    message: "Too many requests from this workspace. Please slow down.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
});

export default tenantRateLimiter;
