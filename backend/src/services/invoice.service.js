import Invoice from "../models/invoice.model.js";
import Client from "../models/client.model.js";
import Organization from "../models/organization.model.js";
import generateInvoicePdf from "../utils/generateInvoicePdf.js";
import sendEmail from "../utils/sendEmail.js";
import PDFDocument from "pdfkit";

class InvoiceService {
  calculateFinancials(items, taxRate = 0, discountRate = 0) {
    let subtotal = 0;
    items.forEach((item) => {
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : item.price;
      subtotal += item.quantity * unitPrice;
    });
    const discountAmount = parseFloat(((subtotal * discountRate) / 100).toFixed(2));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
    const total = parseFloat((taxableAmount + taxAmount).toFixed(2));
    return { subtotal, discountAmount, taxAmount, total };
  }

  async generateInvoiceNumber(organizationId) {
    const org = await Organization.findById(organizationId).select("slug");
    const slug = org?.slug?.toUpperCase().slice(0, 6) || "INV";
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ organization: organizationId });
    const seq = String(count + 1).padStart(4, "0");
    return `${slug}-${year}-${seq}`;
  }

  async createInvoice(organizationId, invoiceData) {
    const { client: clientId, items, taxRate, discountRate, dueDate, notes, currency } = invoiceData;
    if (!clientId || !items || !items.length || !dueDate) {
      throw new Error("Client, items list, and due date are required");
    }
    const client = await Client.findOne({ _id: clientId, organization: organizationId });
    if (!client) throw new Error("Client not found or access denied");

    const { subtotal, discountAmount, taxAmount, total } = this.calculateFinancials(items, taxRate, discountRate);
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    return await Invoice.create({
      organization: organizationId,
      tenantId: organizationId,
      client: clientId,
      clientId,
      invoiceNumber,
      items,
      lineItems: items.map((i) => ({
        description: i.name || i.description,
        quantity: i.quantity,
        unitPrice: i.price || i.unitPrice,
        amount: i.quantity * (i.price || i.unitPrice),
      })),
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      discountRate: discountRate || 0,
      discountAmount,
      total,
      totalAmount: total,
      status: "draft",
      currency: currency || client.currency || "INR",
      dueDate: new Date(dueDate),
      notes: notes || "",
    });
  }

  async getInvoices(organizationId, query = {}, allowedClientIds = null) {
    const filter = { organization: organizationId };
    if (query.status) filter.status = query.status;
    
    if (allowedClientIds !== null) {
      if (query.client) {
        const queryClientIdStr = query.client.toString();
        const isAllowed = allowedClientIds.some(id => id.toString() === queryClientIdStr);
        if (!isAllowed) {
          return { invoices: [], total: 0, page: parseInt(query.page) || 1, pages: 0 };
        }
        filter.client = query.client;
      } else {
        filter.client = { $in: allowedClientIds };
      }
    } else if (query.client) {
      filter.client = query.client;
    }

    if (query.startDate && query.endDate) {
      filter.createdAt = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).populate("client", "name email company currency").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);
    return { invoices, total, page, pages: Math.ceil(total / limit) };
  }

  async getInvoiceById(organizationId, id) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId }).populate("client");
    if (!invoice) throw new Error("Invoice not found or access denied");
    return invoice;
  }

  async updateInvoice(organizationId, id, updateData) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId });
    if (!invoice) throw new Error("Invoice not found or access denied");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be modified");

    const items = updateData.items || invoice.items;
    const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : invoice.taxRate;
    const discountRate = updateData.discountRate !== undefined ? updateData.discountRate : invoice.discountRate;
    const { subtotal, discountAmount, taxAmount, total } = this.calculateFinancials(items, taxRate, discountRate);

    return await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          items,
          lineItems: items.map((i) => ({
            description: i.name || i.description,
            quantity: i.quantity,
            unitPrice: i.price || i.unitPrice,
            amount: i.quantity * (i.price || i.unitPrice),
          })),
          taxRate, taxAmount, discountRate, discountAmount, subtotal,
          total, totalAmount: total,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : invoice.dueDate,
          client: updateData.client || invoice.client,
          notes: updateData.notes !== undefined ? updateData.notes : invoice.notes,
        },
      },
      { new: true }
    ).populate("client");
  }

  async transitionStatus(organizationId, id, nextStatus) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId }).populate("client");
    if (!invoice) throw new Error("Invoice not found or access denied");

    const allowed = {
      draft: ["sent"],
      sent: ["paid", "overdue", "void"],
      overdue: ["paid", "void"],
      paid: [],
      void: [],
    };

    if (!allowed[invoice.status].includes(nextStatus)) {
      throw new Error(`Invalid transition: '${invoice.status}' → '${nextStatus}'`);
    }

    invoice.status = nextStatus;
    if (nextStatus === "sent") invoice.sentAt = invoice.sentAt || new Date();
    if (nextStatus === "paid") { invoice.paidAt = new Date(); invoice.paidAmount = invoice.totalAmount || invoice.total; }
    if (nextStatus === "void") invoice.voidedAt = new Date();
    await invoice.save();

    if (nextStatus === "sent") {
      try { await this.sendInvoiceByEmail(invoice); } catch (_) {}
    }
    return invoice;
  }

  async sendInvoice(organizationId, id) {
    return this.transitionStatus(organizationId, id, "sent");
  }

  async voidInvoice(organizationId, id, reason = "") {
    const invoice = await this.transitionStatus(organizationId, id, "void");
    if (reason) invoice.internalNotes = [invoice.internalNotes, `Void reason: ${reason}`].filter(Boolean).join("\n");
    await invoice.save();
    return invoice;
  }

  async markPaid(organizationId, id) {
    return this.transitionStatus(organizationId, id, "paid");
  }

  async deleteDraft(organizationId, id) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId });
    if (!invoice) throw new Error("Invoice not found or access denied");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be deleted");
    await invoice.deleteOne();
    return invoice;
  }

  async getInvoicePdfBuffer(organizationId, id) {
    const invoice = await this.getInvoiceById(organizationId, id);
    const client = await Client.findOne({ _id: invoice.client, organization: organizationId });
    if (!client) throw new Error("Client not found");
    return await generateInvoicePdf({ ...invoice.toObject(), tax: invoice.taxAmount }, client);
  }

  async sendInvoiceByEmail(invoice) {
    const client = invoice.client;
    const pdfBuffer = await generateInvoicePdf({ ...invoice.toObject(), tax: invoice.taxAmount }, client);
    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from BillNest`,
      text: `Hello ${client.name},\n\nPlease find attached invoice ${invoice.invoiceNumber}.\n\nTotal: ${invoice.currency} ${(invoice.total || invoice.totalAmount || 0).toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business!`,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }],
    });
  }

  async sendInvoiceEmailDirect(invoice, client, recipientEmail) {
    const pdfBuffer = await generateInvoicePdf(invoice, client);
    const currency = invoice.currency || "INR";
    const invoiceNumber = invoice.invoiceNumber || invoice.id || "INV-TEMP";
    const totalAmount = invoice.total || invoice.totalAmount || 0;
    const clientName = client.name || client.company || "Valued Client";
    const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A";

    await sendEmail({
      to: recipientEmail,
      subject: `Invoice ${invoiceNumber} from BillNest`,
      text: `Hello ${clientName},\n\nPlease find attached invoice ${invoiceNumber}.\n\nTotal: ${currency} ${totalAmount.toFixed(2)}\nDue Date: ${dueDateStr}\n\nThank you for your business!`,
      attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }],
    });
  }

  async exportCsvReport(organizationId, filters = {}, allowedClientIds = null) {
    const { invoices } = await this.getInvoices(organizationId, { ...filters, limit: 10000 }, allowedClientIds);
    let csv = "Invoice Number,Client Name,Client Email,Currency,Subtotal,Tax,Discount,Total,Status,Due Date,Created At\n";
    invoices.forEach((inv) => {
      const clientName = inv.client ? inv.client.name.replace(/"/g, '""') : "Unknown";
      const clientEmail = inv.client ? inv.client.email : "";
      csv += `"${inv.invoiceNumber}","${clientName}","${clientEmail}","${inv.currency || "INR"}",${inv.subtotal || 0},${inv.taxAmount || 0},${inv.discountAmount || 0},${inv.total || inv.totalAmount || 0},"${inv.status}","${new Date(inv.dueDate).toISOString().split("T")[0]}","${new Date(inv.createdAt).toISOString().split("T")[0]}"\n`;
    });
    return csv;
  }

  async exportPdfReport(organizationId, filters = {}, allowedClientIds = null) {
    const { invoices } = await this.getInvoices(organizationId, { ...filters, limit: 10000 }, allowedClientIds);
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc.fontSize(22).text("BillNest — Invoice Summary Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        let totalBilled = 0, totalPaid = 0, totalOverdue = 0;
        invoices.forEach((inv) => {
          const amt = inv.total || inv.totalAmount || 0;
          totalBilled += amt;
          if (inv.status === "paid") totalPaid += amt;
          if (inv.status === "overdue") totalOverdue += amt;
        });

        doc.fontSize(12).text(`Total Invoices: ${invoices.length}`);
        doc.text(`Total Billed: ${totalBilled.toFixed(2)}`);
        doc.text(`Collected (Paid): ${totalPaid.toFixed(2)}`);
        doc.text(`Outstanding (Overdue): ${totalOverdue.toFixed(2)}`);
        doc.moveDown();
        doc.fontSize(14).text("Invoice Details:", { underline: true });
        doc.moveDown(0.5);
        invoices.slice(0, 100).forEach((inv) => {
          const clientName = inv.client ? inv.client.name : "Unknown";
          const amt = inv.total || inv.totalAmount || 0;
          doc.fontSize(9).text(`${inv.invoiceNumber} | ${clientName} | ${inv.currency} ${amt.toFixed(2)} | ${inv.status.toUpperCase()} | Due: ${new Date(inv.dueDate).toLocaleDateString()}`);
        });
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new InvoiceService();
