import ClientService from "../services/client.service.js";
import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";

export const createClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;


    await SubscriptionService.enforceClientLimit(orgId);

    const client = await ClientService.createClient(orgId, {
      ...req.body,
      createdBy: req.user.userId,
    });


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
    if (req.user.role === "member") {
      query.createdBy = req.user.userId;
    }
    const clients = await ClientService.getClients(req.user.organizationId, query);
    res.status(200).json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const data = await ClientService.getClientById(req.user.organizationId, req.params.id);
    if (req.user.role === "member" && data.client.createdBy?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: "Access Denied: You are not assigned to this client" });
    }
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (req.user.role === "member") {
      const data = await ClientService.getClientById(orgId, req.params.id);
      if (data.client.createdBy?.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access Denied: You are not assigned to this client" });
      }
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
    const invoices = await ClientService.getClientInvoices(req.user.organizationId, req.params.id);
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientSubscriptions = async (req, res) => {
  try {
    const subscriptions = await ClientService.getClientSubscriptions(req.user.organizationId, req.params.id);
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
