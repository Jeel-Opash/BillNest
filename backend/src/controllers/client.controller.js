import ClientService from "../services/client.service.js";
import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";

export const createClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;


    await SubscriptionService.enforceClientLimit(orgId);

    const client = await ClientService.createClient(orgId, req.body);


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
    const clients = await ClientService.getClients(req.user.organizationId, req.query);
    res.status(200).json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const client = await ClientService.getClientById(req.user.organizationId, req.params.id);
    res.status(200).json({ success: true, client });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
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