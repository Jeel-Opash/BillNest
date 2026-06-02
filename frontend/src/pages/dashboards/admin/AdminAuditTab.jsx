import React, { useState } from "react";

const AdminAuditTab = () => {
  // Mock audit records with append-only ledger items
  const [logs] = useState([
    { id: "log_1", user: "priya@codecraft.com", role: "admin", action: "INVOICE_CREATED", module: "Invoices", ip: "192.168.1.52", timestamp: "2026-06-02 10:48:12", status: "success" },
    { id: "log_2", user: "priya@codecraft.com", role: "admin", action: "CLIENT_UPDATED", module: "Clients", ip: "192.168.1.52", timestamp: "2026-06-02 10:40:24", status: "success" },
    { id: "log_3", user: "amit@codecraft.com", role: "member", action: "PAYMENT_FAILED", module: "Payments", ip: "103.88.22.14", timestamp: "2026-06-02 09:30:15", status: "failed" },
    { id: "log_4", user: "priya@codecraft.com", role: "admin", action: "TEAM_MEMBER_INVITED", module: "Team", ip: "192.168.1.52", timestamp: "2026-06-01 16:45:00", status: "success" },
    { id: "log_5", user: "system@billnest.io", role: "system", action: "API_KEY_GENERATED", module: "Settings", ip: "127.0.0.1", timestamp: "2026-06-01 12:00:00", status: "success" }
  ]);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search);
    const matchModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-6">

      {/* Ledger Integrity Indicator */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-800 uppercase tracking-wider">Immutable Ledger Verification</h5>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              All compliance logs are signed cryptographically and persisted in an append-only tenant node.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-1.5 select-none text-emerald-700 text-[10px] font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          SHA-256 Ledger Healthy
        </div>
      </div>

      {/* Filters & search */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search logs by email, action, IP..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-600 cursor-pointer outline-none"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="all">All Modules</option>
            <option value="Invoices">Invoices</option>
            <option value="Clients">Clients</option>
            <option value="Payments">Payments</option>
            <option value="Team">Team</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">User Account</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Role</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Action Trace</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Module</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">IP Address</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Timestamp</th>
                <th className="py-3 text-right text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No compliance records found matching constraints.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800">{log.user}</td>
                    <td className="py-3.5 uppercase text-[9px] font-black text-slate-400 tracking-wider">{log.role}</td>
                    <td className="py-3.5 text-slate-900 font-bold">{log.action}</td>
                    <td className="py-3.5">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono text-[10px]">{log.ip}</td>
                    <td className="py-3.5 text-slate-400">{log.timestamp}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        log.status === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>{log.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminAuditTab;
