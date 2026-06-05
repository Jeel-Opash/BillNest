import InvoiceService from "../services/invoice.service.js";
import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";
import { getClientRoleForUser, getAllowedClientIds } from "../utils/permission.js";

export const createInvoice = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const clientId = req.body.client || req.body.clientId;

    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client is required to create an invoice" });
    }

    const clientRole = getClientRoleForUser(req.user, clientId);
    if (clientRole !== "admin" && clientRole !== "member") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to create invoices for this client" });
    }

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
    const allowedClientIds = getAllowedClientIds(req.user);
    const invoices = await InvoiceService.getInvoices(req.user.organizationId, req.query, allowedClientIds);
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.user.organizationId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);
    if (clientRole === "none") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have access to this invoice" });
    }
    res.status(200).json({ success: true, invoice, clientRole });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);
    
    if (clientRole !== "admin" && clientRole !== "member") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to modify invoices for this client" });
    }

    const updatedInvoice = await InvoiceService.updateInvoice(orgId, req.params.id, req.body);

    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_UPDATED",
      { invoiceId: updatedInvoice._id, total: updatedInvoice.total },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const transitionInvoice = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const { status } = req.body;
    const orgId = req.user.organizationId;

    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole === "none" || clientRole === "viewer") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to transition this invoice" });
    }

    if (status === "sent" && clientRole !== "admin" && (clientRole !== "member" || req.user.role === "member")) {
      return res.status(403).json({ success: false, message: "Access Denied: Only Client Admins can send/dispatch invoices" });
    }

    if (status === "void" && (clientRole !== "admin" || req.user.role === "member")) {
      return res.status(403).json({ success: false, message: "Access Denied: Only Client Admins can void invoices" });
    }

    const transitionedInvoice = await InvoiceService.transitionStatus(orgId, req.params.id, status);

    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "INVOICE_STATUS_CHANGED",
      { invoiceId: transitionedInvoice._id, status: transitionedInvoice.status },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: `Invoice status transitioned successfully to '${status}'`,
      invoice: transitionedInvoice,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendInvoice = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole !== "admin" && (clientRole !== "member" || req.user.role === "member")) {
      return res.status(403).json({ success: false, message: "Access Denied: Only Client Admins can send/dispatch invoices" });
    }

    const sentInvoice = await InvoiceService.sendInvoice(orgId, req.params.id);
    await AuditService.logAction(orgId, req.user.userId || "system", "INVOICE_SENT", { invoiceId: sentInvoice._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, invoice: sentInvoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const voidInvoice = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole !== "admin" || req.user.role === "member") {
      return res.status(403).json({ success: false, message: "Access Denied: Only Client Admins can void invoices" });
    }

    const voidedInvoice = await InvoiceService.voidInvoice(orgId, req.params.id, req.body.reason);
    await AuditService.logAction(orgId, req.user.userId || "system", "INVOICE_VOIDED", { invoiceId: voidedInvoice._id, reason: req.body.reason }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, invoice: voidedInvoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markInvoicePaid = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole !== "admin" && clientRole !== "member") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to mark this invoice as paid" });
    }

    const paidInvoice = await InvoiceService.markPaid(orgId, req.params.id);
    await AuditService.logAction(orgId, req.user.userId || "system", "INVOICE_MARKED_PAID", { invoiceId: paidInvoice._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, invoice: paidInvoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied: Only Admins can delete invoices" });
    }

    const deletedInvoice = await InvoiceService.deleteDraft(orgId, req.params.id);
    await AuditService.logAction(orgId, req.user.userId || "system", "INVOICE_DELETED", { invoiceId: deletedInvoice._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, invoice: deletedInvoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole === "none") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have access to this client's invoices" });
    }

    const pdfBuffer = await InvoiceService.getInvoicePdfBuffer(orgId, req.params.id);

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
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const orgId = req.user.organizationId;
    const invoice = await InvoiceService.getInvoiceById(orgId, req.params.id);
    const clientRole = getClientRoleForUser(req.user, invoice.client?._id || invoice.client);

    if (clientRole !== "admin" && (clientRole !== "member" || req.user.role === "member")) {
      return res.status(403).json({ success: false, message: "Access Denied: Only Client Admins can send emails for this client" });
    }
    
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

export const sendInvoiceEmailDirect = async (req, res) => {
  try {
    if (req.user.role === "read_only") {
      return res.status(403).json({ success: false, message: "Access Denied: Read-Only users cannot perform write operations" });
    }

    const { invoice, client, recipientEmail } = req.body;

    if (!invoice || !client || !recipientEmail) {
      return res.status(400).json({ success: false, message: "Invoice, client, and recipientEmail are required" });
    }

    await InvoiceService.sendInvoiceEmailDirect(invoice, client, recipientEmail);

    try {
      const orgId = req.user.organizationId;
      await AuditService.logAction(
        orgId,
        req.user.userId || "system",
        "INVOICE_EMAIL_SENT_DIRECT",
        { invoiceId: invoice.invoiceNumber || invoice.id, recipient: recipientEmail },
        req.ip,
        req.headers["user-agent"]
      );
    } catch (auditError) {
      console.error("Direct Email Audit Log Error:", auditError);
    }

    res.status(200).json({
      success: true,
      message: `Invoice email successfully sent to ${recipientEmail}`,
    });
  } catch (error) {
    console.error("Direct Invoice Email Controller Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};


export const exportReport = async (req, res) => {
  try {
    const { format } = req.query;
    const orgId = req.user.organizationId;
    const allowedClientIds = getAllowedClientIds(req.user);

    if (format === "csv") {
      const csv = await InvoiceService.exportCsvReport(orgId, req.query, allowedClientIds);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=BillNest_Invoices_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const pdfBuffer = await InvoiceService.exportPdfReport(orgId, req.query, allowedClientIds);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=BillNest_Summary_${Date.now()}.pdf`);
      return res.send(pdfBuffer);
    }
  } catch (error) {
    console.error("Export Report Controller Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
