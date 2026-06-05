import ClientService from "../services/client.service.js";
import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";
import { getClientRoleForUser, getAllowedClientIds } from "../utils/permission.js";

export const createClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    await SubscriptionService.enforceClientLimit(orgId);

    const client = await ClientService.createClient(orgId, {
      ...req.body,
      createdBy: req.user.userId,
    });

    // If the creator is not Owner/Admin, assign them "admin" role for this client
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      const User = (await import("../models/user.model.js")).default;
      await User.findByIdAndUpdate(req.user.userId, {
        $push: {
          clientAccess: {
            clientId: client._id.toString(),
            clientName: client.name,
            role: "admin",
          },
        },
      });
      req.user.clientAccess.push({
        clientId: client._id.toString(),
        clientName: client.name,
        role: "admin",
      });
    }

    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "CLIENT_CREATED",
      { clientId: client._id, name: client.name, email: client.email },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    console.error("Create Client Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const query = { ...req.query };
    const allowedClientIds = getAllowedClientIds(req.user);
    const clients = await ClientService.getClients(req.user.organizationId, query, allowedClientIds);
    res.status(200).json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const clientRole = getClientRoleForUser(req.user, req.params.id);
    if (clientRole === "none") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have access to this client" });
    }
    const data = await ClientService.getClientById(req.user.organizationId, req.params.id);
    res.status(200).json({ success: true, ...data, clientRole });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const clientRole = getClientRoleForUser(req.user, req.params.id);

    // Only client-level "admin" (or global Owner/Admin) can update client business info
    if (clientRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to update this client's core details" });
    }

    const client = await ClientService.updateClient(orgId, req.params.id, req.body);

    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "CLIENT_UPDATED",
      { clientId: client._id, name: client.name },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Client details updated successfully",
      client,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const clientRole = getClientRoleForUser(req.user, req.params.id);

    if (clientRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to deactivate this client" });
    }

    const client = await ClientService.deleteClient(orgId, req.params.id);

    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "CLIENT_DEACTIVED",
      { clientId: client._id, name: client.name },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Client deactivated successfully",
      client,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClientInvoices = async (req, res) => {
  try {
    const clientRole = getClientRoleForUser(req.user, req.params.id);
    if (clientRole === "none") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have access to this client" });
    }
    const invoices = await ClientService.getClientInvoices(req.user.organizationId, req.params.id);
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientSubscriptions = async (req, res) => {
  try {
    const clientRole = getClientRoleForUser(req.user, req.params.id);
    if (clientRole === "none") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have access to this client" });
    }
    const subscriptions = await ClientService.getClientSubscriptions(req.user.organizationId, req.params.id);
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
