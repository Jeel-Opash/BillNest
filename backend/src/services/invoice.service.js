import Invoice from "../models/invoice.model.js";
import Client from "../models/client.model.js";
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

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  }




  async createInvoice(organizationId, invoiceData) {
    const { client: clientId, items, taxRate, discountRate, dueDate } = invoiceData;

    if (!clientId || !items || !items.length || !dueDate) {
      throw new Error("Client, items list, and due date are required");
    }


    const client = await Client.findOne({ _id: clientId, organization: organizationId });
    if (!client) {
      throw new Error("Client not found or access denied");
    }

    const { subtotal, discountAmount, taxAmount, total } = this.calculateFinancials(
      items,
      taxRate,
      discountRate
    );

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return await Invoice.create({
      organization: organizationId,
      client: clientId,
      invoiceNumber,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      total,
      status: "draft",
      dueDate: new Date(dueDate),
    });
  }




  async getInvoices(organizationId, query = {}) {
    const filter = { organization: organizationId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.client) {
      filter.client = query.client;
    }
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    return await Invoice.find(filter)
      .populate("client", "name email company")
      .sort({ createdAt: -1 });
  }




  async getInvoiceById(organizationId, id) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId }).populate(
      "client"
    );
    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }
    return invoice;
  }




  async updateInvoice(organizationId, id, updateData) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId });
    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }


    if (invoice.status !== "draft") {
      throw new Error("Only invoices in 'draft' status can be modified");
    }

    const items = updateData.items || invoice.items;
    const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : invoice.taxRate;
    const discountRate =
      updateData.discountRate !== undefined ? updateData.discountRate : invoice.discountRate;

    const { subtotal, discountAmount, taxAmount, total } = this.calculateFinancials(
      items,
      taxRate,
      discountRate
    );

    const updated = await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          items,
          taxRate,
          taxAmount,
          discountRate,
          discountAmount,
          subtotal,
          total,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : invoice.dueDate,
          client: updateData.client || invoice.client,
        },
      },
      { new: true }
    ).populate("client");

    return updated;
  }




  async transitionStatus(organizationId, id, nextStatus) {
    const invoice = await Invoice.findOne({ _id: id, organization: organizationId }).populate("client");
    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }

    const current = invoice.status;
    const allowed = {
      draft: ["sent"],
      sent: ["paid", "overdue", "void"],
      overdue: ["paid", "void"],
      paid: [],
      void: [],
    };

    if (!allowed[current].includes(nextStatus)) {
      throw new Error(`Invalid state transition: Cannot change status from '${current}' to '${nextStatus}'`);
    }

    invoice.status = nextStatus;
    await invoice.save();


    if (nextStatus === "sent") {
      await this.sendInvoiceByEmail(invoice);
    }

    return invoice;
  }

  async sendInvoice(organizationId, id) {
    const invoice = await this.transitionStatus(organizationId, id, "sent");
    invoice.sentAt = invoice.sentAt || new Date();
    await invoice.save();
    return invoice;
  }

  async voidInvoice(organizationId, id, reason = "") {
    const invoice = await this.transitionStatus(organizationId, id, "void");
    invoice.voidedAt = new Date();
    invoice.internalNotes = [invoice.internalNotes, reason && `Void reason: ${reason}`].filter(Boolean).join("\n");
    await invoice.save();
    return invoice;
  }

  async markPaid(organizationId, id) {
    const invoice = await this.transitionStatus(organizationId, id, "paid");
    invoice.paidAt = new Date();
    invoice.paidAmount = invoice.totalAmount || invoice.total || 0;
    await invoice.save();
    return invoice;
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
    if (!client) {
      throw new Error("Client data missing or isolated");
    }


    const invoiceForPdf = {
      ...invoice.toObject(),
      tax: invoice.taxAmount
    };

    return await generateInvoicePdf(invoiceForPdf, client);
  }




  async sendInvoiceByEmail(invoice) {
    const client = invoice.client;


    const invoiceForPdf = {
      ...invoice.toObject(),
      tax: invoice.taxAmount
    };

    const pdfBuffer = await generateInvoicePdf(invoiceForPdf, client);

    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from BillNest`,
      text: `Hello ${client.name},\n\nWe have issued invoice ${invoice.invoiceNumber} for your account.\n\nTotal Amount: $${invoice.total.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease find the attached PDF containing all transaction details.\n\nThank you for your business!`,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }




  async exportCsvReport(organizationId, filters = {}) {
    const invoices = await this.getInvoices(organizationId, filters);
    
    let csv = "Invoice Number,Client Name,Client Email,Subtotal,Tax,Discount,Total,Status,Due Date,Created At\n";
    
    invoices.forEach((inv) => {
      const clientName = inv.client ? inv.client.name.replace(/"/g, '""') : "Unknown";
      const clientEmail = inv.client ? inv.client.email : "";
      const dueDate = new Date(inv.dueDate).toISOString().split("T")[0];
      const createdAt = new Date(inv.createdAt).toISOString().split("T")[0];

      csv += `"${inv.invoiceNumber}","${clientName}","${clientEmail}",${inv.subtotal},${inv.taxAmount},${inv.discountAmount},${inv.total},"${inv.status}","${dueDate}","${createdAt}"\n`;
    });

    return csv;
  }

  async exportPdfReport(organizationId, filters = {}) {
    const invoices = await this.getInvoices(organizationId, filters);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        let buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          resolve(Buffer.concat(buffers));
        });

        doc.fontSize(22).text("Invoice Activity Summary Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        let totalBilled = 0;
        let totalPaid = 0;
        let totalOverdue = 0;

        invoices.forEach((inv) => {
          totalBilled += inv.total;
          if (inv.status === "paid") totalPaid += inv.total;
          if (inv.status === "overdue") totalOverdue += inv.total;
        });

        doc.fontSize(12).text(`Total Invoices: ${invoices.length}`);
        doc.text(`Total Volume Billed: $${totalBilled.toFixed(2)}`);
        doc.text(`Total Collected (Paid): $${totalPaid.toFixed(2)}`);
        doc.text(`Total Outstanding (Overdue): $${totalOverdue.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text("Transactions Details:", { underline: true });
        doc.moveDown(0.5);

        invoices.forEach((inv) => {
          const clientName = inv.client ? inv.client.name : "Unknown";
          doc.fontSize(10).text(
            `${inv.invoiceNumber} | Client: ${clientName} | Total: $${inv.total.toFixed(2)} | Status: ${inv.status.toUpperCase()} | Due: ${new Date(inv.dueDate).toLocaleDateString()}`
          );
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new InvoiceService();
