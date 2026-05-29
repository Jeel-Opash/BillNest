import Client from "../models/client.model.js";

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




  async getClients(organizationId, query = {}) {
    const filter = { organization: organizationId };
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }

    return await Client.find(filter).sort({ name: 1 });
  }




  async getClientById(organizationId, id) {
    const client = await Client.findOne({ _id: id, organization: organizationId });
    if (!client) {
      throw new Error("Client not found or access denied");
    }
    return client;
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
}

export default new ClientService();
