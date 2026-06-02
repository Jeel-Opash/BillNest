import React, { useState } from "react";

const ReadOnlyAuditTab = () => {
  const [search, setSearch] = useState("");
  const [logs] = useState([
    { id: "log_1", action: "User Created Invoice INV-001", module: "INVOICES", actor: "Amit Kumar (Member)", ip: "192.168.1.45", time: "10 mins ago", status: "SUCCESS" },
    { id: "log_2", action: "Admin Updated Client", module: "CLIENTS", actor: "Priya Sharma (Admin)", ip: "192.168.1.12", time: "1 hour ago", status: "SUCCESS" },
    { id: "log_3", action: "Subscription Renewed", module: "SUBSCRIPTIONS", actor: "System Webhook", ip: "Stripe Engine", time: "1 day ago", status: "SUCCESS" },
    { id: "log_4", action: "Payment Failed", module: "PAYMENTS", actor: "Nova Tech (Stripe Gateway)", ip: "34.200.12.99", time: "2 days ago", status: "FAILED" }
  ]);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.module.toLowerCase().includes(search.toLowerCase()) ||
    l.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Timeline list */}
      <div className="lg:col-span-8 space-y-6">

        {/* Read-Only Safeguard Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
          <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Audit Log Compliance Constraints</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
              Compliance records are immutable and append-only. Under auditor observer credentials, clearing logs, modifying descriptions, or disabling trace systems is strictly locked.
            </p>
          </div>
        </div>

        {/* Search controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search auditor activity logs..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Audit Log table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance Activity Logs</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredLogs.length} logs
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No matching log traces registered in the database index.</div>
            ) : (
              filteredLogs.map(l => (
                <div key={l.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-xs">{l.action}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        l.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                      }`}>{l.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1.5">Module: <strong className="text-slate-800">{l.module}</strong> | Actor: {l.actor}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">IP Stamp: {l.ip} | Time: {l.time}</p>
                  </div>

                  <div className="text-left sm:text-right select-none">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Cryptographically Verified
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: details */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 select-none">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Auditor Cryptographic Health
        </h4>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-[10px] text-slate-500 font-semibold">
          <div className="flex justify-between">
            <span>Cryptographic Chain</span>
            <span className="text-emerald-600 font-black">Healthy</span>
          </div>
          <div className="flex justify-between">
            <span>Database Connection</span>
            <span className="text-indigo-600 font-black">Verified Isolated</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReadOnlyAuditTab;
