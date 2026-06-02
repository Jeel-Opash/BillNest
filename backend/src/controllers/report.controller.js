import ReportService from "../services/report.service.js";

export const getInvoiceReport = async (req, res) => {
  try {
    const format = req.query.format || "json";
    if (format === "csv") {
      const csv = await ReportService.invoiceCsv(req.user.organizationId, req.query);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=billnest-invoices.csv");
      return res.send(csv);
    }
    if (format === "pdf") {
      const pdf = await ReportService.invoicePdf(req.user.organizationId, req.query);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=billnest-invoices.pdf");
      return res.send(pdf);
    }
    const data = await ReportService.invoiceReport(req.user.organizationId, req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const rows = await ReportService.revenueReport(req.user.organizationId, req.query);
    if (req.query.format === "csv") {
      const csv = ["Client,Invoices,Revenue", ...rows.map((row) => `"${row.clientName || "Unknown"}",${row.invoices},${row.revenue}`)].join("\n");
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }
    res.json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionReport = async (req, res) => {
  try {
    const rows = await ReportService.subscriptionReport(req.user.organizationId);
    res.json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
