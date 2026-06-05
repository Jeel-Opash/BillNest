import mongoose from "mongoose";

/**
 * Get the client-level role for a user.
 * Owners and Admins have full access (treated as "admin").
 * Members and Read-Only users are restricted by their clientAccess array.
 * Default role is "none" (no access).
 */
export const getClientRoleForUser = (user, clientId) => {
  if (!user) return "none";
  
  // Only owner role is globally unrestricted
  if (user.role === "owner") {
    return "admin";
  }

  const clientAccessList = user.clientAccess || [];

  // Global Admin with no clientAccess limit is unrestricted
  if (user.role === "admin" && clientAccessList.length === 0) {
    return "admin";
  }

  // Look up client in clientAccess array
  const access = clientAccessList.find(
    (ca) => ca.clientId?.toString() === clientId?.toString()
  );

  if (access) {
    return access.role || "none";
  }

  return "none";
};

/**
 * Filter query to limit results to allowed clients.
 * Returns an array of allowed Client ObjectIds, or null if all are allowed.
 */
export const getAllowedClientIds = (user) => {
  if (!user) return [];
  
  // Owner is globally unrestricted
  if (user.role === "owner") {
    return null; 
  }

  const clientAccessList = user.clientAccess || [];

  // Global Admin with no clientAccess limit is unrestricted
  if (user.role === "admin" && clientAccessList.length === 0) {
    return null;
  }

  return clientAccessList
    .filter((ca) => ca.role && ca.role !== "none")
    .map((ca) => {
      try {
        return new mongoose.Types.ObjectId(ca.clientId);
      } catch (e) {
        return ca.clientId;
      }
    });
};
