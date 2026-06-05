import React, { useState } from "react";

const MemberPaymentsTab = ({ payments = [], user, invoices = [] }) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredPayments = payments.filter(p => {
    const statusLower = p.status?.toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "failed") return statusLower === "failed";
    if (activeTab === "successful") return statusLower === "successful" || statusLower === "succeeded";
    return statusLower === activeTab;
  });

  return (
    <div className="space-y-6">

      {/* Role Context Explainer Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-200 rounded-3xl flex items-start gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)] select-none animate-fade-in">
        <div className="w-8 h-8 rounded-xl bg-slate-600/10 text-slate-750 flex items-center justify-center flex-shrink-0 font-bold">
          <span className="material-symbols-outlined text-[18px]">lock_outline</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-600 text-white leading-none">
              Member Console
            </span>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">
              Financial Ledger Guard
            </h5>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
            You are operating in the <strong>Member</strong> context. Transactions below reflect standard B2B client payments routed from the <strong>Payer (Client Target)</strong> to the <strong>Receiver ({user?.organization?.name || "Workspace Organization"})</strong>. You have view-only access to monitor active payments; processing refunds or adjusting gateway configurations remains restricted to owners and admins.
          </p>
        </div>
      </div>

      {/* Table grid container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-3 items-center">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Payments Ledger Logs</h4>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Audit and transaction reference tags</span>
          </div>

          {/* Filtering buttons */}
          <div className="flex gap-1.5 text-[10px] font-black uppercase select-none">
            {[
              { id: "all", label: "All Traces" },
              { id: "successful", label: "Successful" },
              { id: "failed", label: "Failed Logs" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Transaction ID</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Payer (Client)</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Receiver (Workspace)</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Gateway Method</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Stamp Date</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Amount</th>
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Status</th>
                <th className="py-3 text-right text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No matching traces registered under the selected segment.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">{p.id}</td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-indigo-500">upload_file</span>
                          {p.client}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Payer (Outflow)</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-emerald-500">download_for_offline</span>
                          {user?.organization?.name || "CodeCraft Agency"}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Receiver (Inflow)</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{p.method}</td>
                    <td className="py-3.5 text-slate-400">{p.date}</td>
                    <td className="py-3.5 font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        p.status?.toLowerCase() === "successful" || p.status?.toLowerCase() === "succeeded"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : p.status?.toLowerCase() === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-0.5 select-none">
                        <span className="material-symbols-outlined text-[14px]">lock_outline</span>
                        Audit Locked
                      </span>
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

export default MemberPaymentsTab;
