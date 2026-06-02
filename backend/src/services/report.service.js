import Invoice from "../models/invoice.model.js";
import Subscription from "../models/subscription.model.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

class ReportService {
  buildInvoiceFilter(organizationId, query = {}) {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const filter = { organization: orgId };
    if (query.status) filter.status = query.status;
    if (query.clientId) filter.client = query.clientId;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }
    return filter;
  }

  async invoiceReport(organizationId, query = {}) {
    const invoices = await Invoice.find(this.buildInvoiceFilter(organizationId, query))
      .populate("client", "name email")
      .sort({ createdAt: -1 });

    const totals = invoices.reduce(
      (acc, invoice) => {
        acc.count += 1;
        acc.totalAmount += invoice.totalAmount || invoice.total || 0;
        if (invoice.status === "paid") acc.paidAmount += invoice.totalAmount || invoice.total || 0;
        if (["sent", "overdue"].includes(invoice.status)) acc.outstandingAmount += invoice.totalAmount || invoice.total || 0;
        return acc;
      },
      { count: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0 }
    );

    return { invoices, totals };
  }

  async invoiceCsv(organizationId, query = {}) {
    const { invoices } = await this.invoiceReport(organizationId, query);
    const rows = [["Invoice Number", "Client", "Email", "Status", "Currency", "Total", "Due Date", "Created At"]];
    invoices.forEach((invoice) => {
      rows.push([
        invoice.invoiceNumber,
        invoice.client?.name || "",
        invoice.client?.email || "",
        invoice.status,
        invoice.currency,
        invoice.totalAmount || invoice.total || 0,
        invoice.dueDate?.toISOString?.().slice(0, 10) || "",
        invoice.createdAt?.toISOString?.().slice(0, 10) || "",
      ]);
    });
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  }

  async invoicePdf(organizationId, query = {}) {
    const { invoices, totals } = await this.invoiceReport(organizationId, query);
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 48 });
        const buffers = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        doc.fontSize(20).text("Invoice Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(11).text(`Invoices: ${totals.count}`);
        doc.text(`Total: ${totals.totalAmount.toFixed(2)}`);
        doc.text(`Paid: ${totals.paidAmount.toFixed(2)}`);
        doc.text(`Outstanding: ${totals.outstandingAmount.toFixed(2)}`);
        doc.moveDown();

        invoices.slice(0, 80).forEach((invoice) => {
          doc.fontSize(9).text(`${invoice.invoiceNumber} | ${invoice.client?.name || "Unknown"} | ${invoice.status} | ${(invoice.totalAmount || invoice.total || 0).toFixed(2)}`);
        });
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async revenueReport(organizationId, query = {}) {
    const match = this.buildInvoiceFilter(organizationId, { ...query, status: "paid" });
    const rows = await Invoice.aggregate([
      { $match: match },
      { $group: { _id: "$client", revenue: { $sum: "$totalAmount" }, invoices: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      { $project: { clientId: "$_id", clientName: "$client.name", revenue: 1, invoices: 1, _id: 0 } },
    ]);
    return rows;
  }

  async subscriptionReport(organizationId) {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    return Subscription.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: { status: "$status", plan: "$planName" }, count: { $sum: 1 }, mrr: { $sum: { $cond: [{ $eq: ["$billingCycle", "yearly"] }, { $divide: ["$amount", 12] }, "$amount"] } } } },
      { $sort: { "_id.plan": 1 } },
    ]);
  }
}

export default new ReportService();
