import InvoiceService from "../services/invoice.service.js";
import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";

export const createInvoice = async (req, res) => {
  try {
    const orgId = req.user.organizationId;


    await SubscriptionService.enforceInvoiceLimit(orgId);

    const invoice = await InvoiceService.createInvoice(orgId, req.body);


    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_CREATED",
      { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, total: invoice.total },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("Create Invoice Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceService.getInvoices(req.user.organizationId, req.query);
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.user.organizationId, req.params.id);
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.updateInvoice(orgId, req.params.id, req.body);


    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_UPDATED",
      { invoiceId: invoice._id, total: invoice.total },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const transitionInvoice = async (req, res) => {
  try {
    const { status } = req.body;
    const orgId = req.user.organizationId;

    const invoice = await InvoiceService.transitionStatus(orgId, req.params.id, status);


    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_STATUS_CHANGED",
      { invoiceId: invoice._id, status: invoice.status },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: `Invoice status transitioned successfully to '${status}'`,
      invoice,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const pdfBuffer = await InvoiceService.getInvoicePdfBuffer(
      req.user.organizationId,
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${req.params.id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Download Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendInvoiceEmail = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    
    await InvoiceService.sendInvoiceByEmail(invoice);


    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_EMAIL_SENT",
      { invoiceId: invoice._id, recipient: invoice.client.email },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Invoice email successfully dispatched with PDF attachment",
    });
  } catch (error) {
    console.error("Invoice Email Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { format } = req.query;
    const orgId = req.user.organizationId;

    if (format === "csv") {
      const csv = await InvoiceService.exportCsvReport(orgId, req.query);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=BillNest_Invoices_${Date.now()}.csv`);
      return res.send(csv);
    } else {

      const pdfBuffer = await InvoiceService.exportPdfReport(orgId, req.query);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=BillNest_Summary_${Date.now()}.pdf`);
      return res.send(pdfBuffer);
    }
  } catch (error) {
    console.error("Export Report Controller Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};