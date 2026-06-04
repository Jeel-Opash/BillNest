import React, { useState, useEffect, useMemo } from "react";
import AuditLog from "../../../components/AuditLog";

const generateLogsFromData = ({ clients = [], invoices = [], payments = [], teamList = [], subscriptions = [] }) => {
  const logs = [];

  // Seed logs from invoices
  invoices.forEach((inv, i) => {
    logs.push({
      id: `log_inv_${inv.id || i}`,
      timestamp: inv.date ? `${inv.date} 10:${String(i * 3 + 10).padStart(2, "0")}:00` : "2026-06-01 10:00:00",
      actor: "Workspace Owner",
      role: "Owner",
      action: inv.status === "draft" ? "Invoice Draft Created" : inv.status === "sent" ? "Invoice Sent to Client" : inv.status === "paid" ? "Invoice Marked Paid" : "Invoice Created",
      details: `Invoice ${inv.id} for ${inv.client} — ₹${Number(inv.amount || 0).toLocaleString()}`,
      module: "Invoice Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    });
  });

  // Seed logs from payments
  payments.forEach((pay, i) => {
    const isSuccess = pay.status?.toLowerCase() === "succeeded";
    logs.push({
      id: `log_pay_${pay.id || i}`,
      timestamp: pay.date ? `${pay.date} 14:${String(i * 5 + 5).padStart(2, "0")}:00` : "2026-06-01 14:00:00",
      actor: "Stripe Webhook",
      role: "System Integrator",
      action: isSuccess ? "Payment Succeeded" : "Payment Failed",
      details: `${isSuccess ? "Captured" : "Failed"} ₹${Number(pay.amount || 0).toLocaleString()} from ${pay.client} via ${pay.method || "Card"} for ${pay.invoice || "invoice"}`,
      module: "Payments",
      ipAddress: "54.187.205.235",
      status: isSuccess ? "SUCCESS" : "FAILED",
    });
  });

  // Seed logs from clients
  clients.forEach((cl, i) => {
    logs.push({
      id: `log_cl_${cl.id || i}`,
      timestamp: `2026-05-${String(28 - i).padStart(2, "0")} 09:${String(i * 4 + 5).padStart(2, "0")}:00`,
      actor: "Workspace Owner",
      role: "Owner",
      action: "Client Account Created",
      details: `Registered client ${cl.name || cl.company} (${cl.email || "no email"}) in the billing workspace`,
      module: "Client Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    });
  });

  // Seed logs from team members
  teamList.forEach((member, i) => {
    if (member.role === "owner") return;
    logs.push({
      id: `log_tm_${member.id || i}`,
      timestamp: `2026-05-${String(27 - i).padStart(2, "0")} 16:${String(i * 6 + 10).padStart(2, "0")}:00`,
      actor: "Workspace Owner",
      role: "Owner",
      action: member.status === "pending" ? "Team Invite Dispatched" : "Member Role Assigned",
      details: `${member.status === "pending" ? "Sent invitation to" : "Granted"} ${member.email} with ${member.role?.toUpperCase()} privileges`,
      module: "Team Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    });
  });

  // Seed logs from subscriptions
  subscriptions.forEach((sub, i) => {
    logs.push({
      id: `log_sub_${sub.id || i}`,
      timestamp: `2026-05-${String(26 - i).padStart(2, "0")} 11:${String(i * 7 + 8).padStart(2, "0")}:00`,
      actor: "Workspace Owner",
      role: "Owner",
      action: "Subscription Plan Created",
      details: `Deployed plan "${sub.name}" for ${sub.client || "client"} at ₹${Number(sub.price || 0).toLocaleString()}/${sub.cycle || "month"}`,
      module: "Subscription Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    });
  });

  // Static baseline security events
  logs.push(
    {
      id: "log_sec_001",
      timestamp: "2026-05-30 08:04:10",
      actor: "Unknown",
      role: "Unauthorized",
      action: "Auth Failure Detected",
      details: "Invalid login attempt from unregistered IP. Session blocked by security policy.",
      module: "Security",
      ipAddress: "203.0.113.42",
      status: "FAILED",
    },
    {
      id: "log_sec_002",
      timestamp: "2026-05-29 14:02:18",
      actor: "Workspace Owner",
      role: "Owner",
      action: "API Key Generated",
      details: "New production API key created and scoped to billing operations for this workspace.",
      module: "Settings",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    },
    {
      id: "log_sec_003",
      timestamp: "2026-05-28 09:15:00",
      actor: "Workspace Owner",
      role: "Owner",
      action: "Organization Settings Updated",
      details: "Updated GST rate from 15% to 18% and changed invoice payment terms to Net-30.",
      module: "Settings",
      ipAddress: "192.168.1.45",
      status: "SUCCESS",
    },
    {
      id: "log_sec_004",
      timestamp: "2026-05-27 17:45:33",
      actor: "Stripe Webhook",
      role: "System Integrator",
      action: "Subscription Renewal Processed",
      details: "Automatic renewal cycle initiated and queued for eligible active subscription plans.",
      module: "Subscription Management",
      ipAddress: "54.187.205.235",
      status: "SUCCESS",
    }
  );

  // Sort newest first
  logs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  return logs;
};

const AuditLogsTab = ({ clients = [], invoices = [], payments = [], teamList = [], subscriptions = [], showToast }) => {
  const [liveEvents, setLiveEvents] = useState([]);

  const dynamicLogs = useMemo(
    () => generateLogsFromData({ clients, invoices, payments, teamList, subscriptions }),
    [clients, invoices, payments, teamList, subscriptions]
  );

  const allLogs = useMemo(() => [...liveEvents, ...dynamicLogs], [liveEvents, dynamicLogs]);

  // Simulate a real-time audit event every 45 seconds
  useEffect(() => {
    const events = [
      { action: "Automated Backup Triggered", details: "Tenant workspace data snapshot created and stored securely.", module: "Settings", actor: "System Automation", role: "System", status: "SUCCESS", ipAddress: "10.0.0.1" },
      { action: "Session Token Refreshed", details: "JWT access token renewed for authenticated workspace session.", module: "Security", actor: "Auth Service", role: "System", status: "SUCCESS", ipAddress: "127.0.0.1" },
      { action: "Webhook Delivery Attempted", details: "Stripe payment event dispatched to configured webhook endpoint.", module: "Payments", actor: "Stripe Webhook", role: "System Integrator", status: "SUCCESS", ipAddress: "54.187.205.235" },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const evt = events[idx % events.length];
      const now = new Date();
      const ts = now.toISOString().replace("T", " ").split(".")[0];
      setLiveEvents((prev) => [{
        id: `live_${Date.now()}`,
        timestamp: ts,
        ...evt,
      }, ...prev].slice(0, 10));
      idx++;
    }, 45000);
    return () => clearInterval(interval);
  }, []);

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
    a.download = `billnest_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast("Audit log exported successfully!", "success");
  };

  return (
    <AuditLog
      logs={allLogs}
      title="Compliance & Activity Audit Logs"
      description={`Track append-only security and billing events across your tenant workspace. ${allLogs.length} total records.`}
      onExportCSV={handleExportCSV}
    />
  );
};

export default AuditLogsTab;
