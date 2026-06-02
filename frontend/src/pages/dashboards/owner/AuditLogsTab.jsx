import React, { useState, useMemo } from "react";

const AuditLogsTab = ({
  user,
  showToast
}) => {
  // --- Persistent or Initial Mock Audit Logs state ---
  const [logs] = useState([
    {
      id: "log_001",
      timestamp: "2026-06-02 10:40:15",
      actor: "Rahul Patel",
      role: "Owner",
      action: "Invoice Created",
      details: "Generated invoice #INV-2026-004 for Acme Corp (₹45,000)",
      module: "Invoice Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS"
    },
    {
      id: "log_002",
      timestamp: "2026-06-02 09:15:32",
      actor: "Rahul Patel",
      role: "Owner",
      action: "Client Updated",
      details: "Modified billing tax settings for PixelCraft Inc details",
      module: "Client Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS"
    },
    {
      id: "log_003",
      timestamp: "2026-06-02 08:04:10",
      actor: "Stripe Webhook",
      role: "System Integrator",
      action: "Payment Failed",
      details: "Auto-charge attempt declined for PixelCraft Inc invoice (#INV-2026-002)",
      module: "Payments",
      ipAddress: "54.120.9.110",
      status: "FAILED"
    },
    {
      id: "log_004",
      timestamp: "2026-06-01 16:30:22",
      actor: "Rahul Patel",
      role: "Owner",
      action: "Member Invited",
      details: "Dispatched workspace invitation to neha@codecraft.com",
      module: "Team Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS"
    },
    {
      id: "log_005",
      timestamp: "2026-05-30 11:22:45",
      actor: "Rahul Patel",
      role: "Owner",
      action: "Subscription Plan Created",
      details: "Deployed Growth Tier subscription plan (Monthly/Quarterly options)",
      module: "Subscription Management",
      ipAddress: "192.168.1.45",
      status: "SUCCESS"
    },
    {
      id: "log_006",
      timestamp: "2026-05-29 14:02:18",
      actor: "Priya Sharma",
      role: "Admin",
      action: "Invoice Voided",
      details: "Voided draft invoice #INV-2026-001 due to billing details mismatch",
      module: "Invoice Management",
      ipAddress: "13.233.45.19",
      status: "SUCCESS"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm);

      const matchesModule = selectedModule === "all" || log.module === selectedModule;
      const matchesStatus = selectedStatus === "all" || log.status === selectedStatus;

      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [logs, searchTerm, selectedModule, selectedStatus]);

  // Module style mapping
  const getModuleBadgeColor = (mod) => {
    switch (mod) {
      case "Invoice Management":
        return "bg-indigo-50 text-indigo-700 border-indigo-100/50";
      case "Client Management":
        return "bg-emerald-50 text-emerald-700 border-emerald-100/50";
      case "Payments":
        return "bg-rose-50 text-rose-700 border-rose-100/50";
      case "Team Management":
        return "bg-amber-50 text-amber-700 border-amber-100/50";
      case "Subscription Management":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header with Immutable Verification Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Compliance & Activity Audit Logs</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Track append-only activity metrics and security access trails across this tenant partition.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-2 text-xs font-bold shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-emerald-600 animate-pulse">lock</span>
          LEDGER SECURED (SHA-256)
        </div>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by User, Action, or IP Address..."
            className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-3.5 text-xs font-bold outline-none transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Module Filter */}
        <select
          className="bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer shadow-sm text-slate-700"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="all">All Modules</option>
          <option value="Client Management">Client Management</option>
          <option value="Invoice Management">Invoice Management</option>
          <option value="Payments">Payments</option>
          <option value="Team Management">Team Management</option>
          <option value="Subscription Management">Subscription Management</option>
        </select>

        {/* Status Filter */}
        <select
          className="bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer shadow-sm text-slate-700"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="SUCCESS">Success only</option>
          <option value="FAILED">Failed only</option>
        </select>
      </div>

      {/* Table Ledger Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">User / Actor</th>
                <th className="p-3.5">Action Triggered</th>
                <th className="p-3.5">Module Scope</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5 pr-5 text-right">Ledger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[40px] text-slate-300">history_toggle_off</span>
                    <h5 className="font-heading font-bold text-sm text-slate-800 mt-2">No Records Found</h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                      No append-only logs matched your designated filters. Refine search strings to audit active ledgers.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isSuccess = log.status === "SUCCESS";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* Timestamp */}
                      <td className="p-3.5 pl-5 font-mono text-slate-500 text-[10px]">
                        {log.timestamp}
                      </td>

                      {/* User / Actor */}
                      <td className="p-3.5 text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-bold">{log.actor}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{log.role}</span>
                        </div>
                      </td>

                      {/* Action & Detail details */}
                      <td className="p-3.5 max-w-xs">
                        <span className="font-bold text-slate-800 block text-xs">{log.action}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 leading-relaxed">{log.details}</span>
                      </td>

                      {/* Module */}
                      <td className="p-3.5">
                        <span className={`inline-block border rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${getModuleBadgeColor(log.module)}`}>
                          {log.module}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="p-3.5 font-mono text-slate-500 text-[10px]">
                        {log.ipAddress}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 pr-5 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          isSuccess ? "text-emerald-700" : "text-rose-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuditLogsTab;
