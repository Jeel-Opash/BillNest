import React, { useMemo } from "react";
import AuditLog from "../../../components/AuditLog";

const generateAdminLogs = ({ clients = [], invoices = [], teamList = [] }) => {
  const logs = [];

  invoices.forEach((inv, i) => {
    logs.push({
      id: `adm_inv_${inv.id || i}`,
      timestamp: inv.date ? `${inv.date} 10:${String(i * 4 + 8).padStart(2, "0")}:00` : "2026-06-01 10:00:00",
      actor: "Admin User",
      role: "Admin",
      action: inv.status === "paid" ? "Invoice Marked Paid" : inv.status === "sent" ? "Invoice Dispatched" : "Invoice Draft Created",
      details: `${inv.id} for ${inv.client} — ₹${Number(inv.amount || 0).toLocaleString()}`,
      module: "Invoice Management",
      ipAddress: "192.168.1.52",
      status: "SUCCESS",
    });
  });

  clients.forEach((cl, i) => {
    logs.push({
      id: `adm_cl_${cl.id || i}`,
      timestamp: `2026-05-${String(29 - i).padStart(2, "0")} 09:${String(i * 5 + 10).padStart(2, "0")}:00`,
      actor: "Admin User",
      role: "Admin",
      action: "Client Profile Updated",
      details: `Modified billing details for ${cl.name || cl.company} (${cl.email || "no email"})`,
      module: "Client Management",
      ipAddress: "192.168.1.52",
      status: "SUCCESS",
    });
  });

  teamList.forEach((m, i) => {
    if (m.role === "owner") return;
    logs.push({
      id: `adm_tm_${m.id || i}`,
      timestamp: `2026-05-${String(28 - i).padStart(2, "0")} 15:${String(i * 7 + 5).padStart(2, "0")}:00`,
      actor: "Admin User",
      role: "Admin",
      action: "Team Member Invited",
      details: `Dispatched workspace invitation to ${m.email} with ${m.role?.toUpperCase()} role`,
      module: "Team Management",
      ipAddress: "192.168.1.52",
      status: "SUCCESS",
    });
  });

  // Static admin events
  logs.push(
    { id: "adm_s1", timestamp: "2026-06-02 09:30:15", actor: "amit@codecraft.com", role: "Member", action: "Payment Retry Failed", details: "Auto-charge attempt declined for Nova Software Inc. Decline code: insufficient_funds", module: "Payments", ipAddress: "103.88.22.14", status: "FAILED" },
    { id: "adm_s2", timestamp: "2026-06-01 12:00:00", actor: "System Integration", role: "System", action: "API Key Rotation", details: "Automatic 90-day API key expiry enforcement triggered for workspace billing scope", module: "Settings", ipAddress: "127.0.0.1", status: "SUCCESS" },
    { id: "adm_s3", timestamp: "2026-05-31 08:15:00", actor: "Stripe Webhook", role: "System Integrator", action: "Subscription Renewal", details: "Recurring billing cycle charged for active subscription plans within this tenant", module: "Subscription Management", ipAddress: "54.187.205.235", status: "SUCCESS" },
    { id: "adm_s4", timestamp: "2026-05-30 17:00:00", actor: "Admin User", role: "Admin", action: "Report Exported", details: "Monthly revenue CSV report downloaded for compliance archiving (June 2026)", module: "Reports", ipAddress: "192.168.1.52", status: "SUCCESS" }
  );

  logs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  return logs;
};

const AdminAuditTab = ({ clients = [], invoices = [], teamList = [], showToast }) => {
  const logs = useMemo(
    () => generateAdminLogs({ clients, invoices, teamList }),
    [clients, invoices, teamList]
  );

  const handleExportCSV = (filteredLogs) => {
    const headers = ["Timestamp", "Actor", "Role", "Action", "Details", "Module", "IP Address", "Status"];
    const rows = filteredLogs.map((l) => [
      l.timestamp || "",
      l.actor || l.user || "",
      l.role || "",
      l.action || "",
      `"${(l.details || "").replace(/"/g, "'")}"`,
      l.module || "",
      l.ipAddress || l.ip || "",
      l.status || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast("Admin audit log exported!", "success");
  };

  return (
    <AuditLog
      logs={logs}
      title="Compliance & Admin Security Logs"
      description={`Verify admin modifications and client ledger integrity events in this organization partition. ${logs.length} total records.`}
      onExportCSV={handleExportCSV}
    />
  );
};

export default AdminAuditTab;
