import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import Subscription from "../models/subscription.model.js";
import mongoose from "mongoose";

class ClientService {



  async createClient(organizationId, clientData) {
    if (!clientData.name || !clientData.email) {
      throw new Error("Client name and email are required");
    }

    return await Client.create({
      ...clientData,
      organization: organizationId,
    });
  }




  async getClients(organizationId, query = {}, allowedClientIds = null) {
    const filter = { organization: organizationId };
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    if (query.createdBy !== undefined) {
      filter.createdBy = query.createdBy;
    }

    if (allowedClientIds !== null) {
      filter._id = { $in: allowedClientIds };
    }

    return await Client.find(filter).sort({ name: 1 });
  }




  async getClientById(organizationId, id) {
    const client = await Client.findOne({ _id: id, organization: organizationId });
    if (!client) {
      throw new Error("Client not found or access denied");
    }
    const stats = await this.getClientStats(organizationId, id);
    return { client, stats };
  }




  async updateClient(organizationId, id, updateData) {
    const client = await Client.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!client) {
      throw new Error("Client not found or access denied");
    }
    return client;
  }




  async deleteClient(organizationId, id) {
    const client = await Client.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!client) {
      throw new Error("Client not found or access denied");
    }
    return client;
  }

  async getClientStats(organizationId, id) {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const clientId = new mongoose.Types.ObjectId(id);
    const [stats] = await Invoice.aggregate([
      { $match: { organization: orgId, client: clientId } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0] } },
          outstanding: { $sum: { $cond: [{ $in: ["$status", ["sent", "overdue"]] }, "$totalAmount", 0] } },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);
    return stats || { totalBilled: 0, totalPaid: 0, outstanding: 0, invoiceCount: 0 };
  }

  async getClientInvoices(organizationId, id) {
    return Invoice.find({ organization: organizationId, client: id }).sort({ createdAt: -1 });
  }

  async getClientSubscriptions(organizationId, id) {
    return Subscription.find({ organization: organizationId, client: id }).sort({ createdAt: -1 });
  }
}

export default new ClientService();
