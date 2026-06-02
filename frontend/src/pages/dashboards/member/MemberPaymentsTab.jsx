import React, { useState } from "react";

const MemberPaymentsTab = () => {
  const [payments] = useState([
    { id: "tx_1", client: "ABC Restaurant", amount: 9900, date: "2026-06-01", status: "successful", method: "Stripe Card" },
    { id: "tx_2", client: "Pixel Studio", amount: 2900, date: "2026-05-28", status: "failed", method: "UPI Pay" },
    { id: "tx_3", client: "Nova Software Inc", amount: 45000, date: "2026-05-25", status: "refunded", method: "Net Banking" },
    { id: "tx_4", client: "Pixel Studio", amount: 15000, date: "2026-06-02", status: "pending", method: "Stripe Sandbox" }
  ]);

  const [activeTab, setActiveTab] = useState("all");

  const filteredPayments = payments.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "failed") return p.status === "failed";
    return p.status === activeTab;
  });

  return (
    <div className="space-y-6">

      {/* Safeguard banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
        <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
        <div>
          <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Financial Ledger Guard</h5>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
            You are operating in a **Member** workspace context. Members have view-only rights to monitor successful or failed Stripe payments. Processing refunds or adjusting transaction configurations is locked.
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
                <th className="py-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Client Target</th>
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
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No matching traces registered under the selected segment.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">{p.id}</td>
                    <td className="py-3.5 text-slate-800">{p.client}</td>
                    <td className="py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{p.method}</td>
                    <td className="py-3.5 text-slate-400">{p.date}</td>
                    <td className="py-3.5 font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        p.status === "successful"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : p.status === "failed"
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
