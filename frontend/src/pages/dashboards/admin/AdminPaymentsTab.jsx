import React, { useState } from "react";

const AdminPaymentsTab = ({
  showToast
}) => {
  const [payments, setPayments] = useState([
    { id: "tx_1", client: "ABC Restaurant", amount: 9900, date: "2026-06-01", status: "successful", method: "Stripe Card" },
    { id: "tx_2", client: "Pixel Studio", amount: 2900, date: "2026-05-28", status: "failed", method: "UPI Pay" },
    { id: "tx_3", client: "Nova Software Inc", amount: 45000, date: "2026-05-25", status: "refund_requested", method: "Net Banking" },
    { id: "tx_4", client: "Pixel Studio", amount: 15000, date: "2026-06-02", status: "pending", method: "Stripe Sandbox" }
  ]);

  const [activeTab, setActiveTab] = useState("all");

  const retryPayment = (id) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: "successful" } : p));
    showToast(`Payment transaction ${id} retried and processed successfully!`, "success");
  };

  const processRefund = (id) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: "refunded" } : p));
    showToast(`Refund processed for transaction ${id}.`, "info");
  };

  // Computations
  const totalRevenue = payments.filter(p => p.status === "successful").reduce((acc, curr) => acc + curr.amount, 0);
  const successfulCount = payments.filter(p => p.status === "successful").length;
  const failedCount = payments.filter(p => p.status === "failed").length;
  const pendingCount = payments.filter(p => p.status === "pending").length;

  const filteredPayments = payments.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "failed") return p.status === "failed";
    if (activeTab === "refunds") return p.status === "refund_requested" || p.status === "refunded";
    return p.status === activeTab;
  });

  return (
    <div className="space-y-6">

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue Collected", val: `₹${totalRevenue.toLocaleString()}`, color: "text-emerald-700 bg-emerald-50", desc: `${successfulCount} success bills` },
          { label: "Successful Payments", val: successfulCount, color: "text-indigo-700 bg-indigo-50", desc: "100% processed" },
          { label: "Failed Payments", val: failedCount, color: "text-rose-700 bg-rose-50", desc: "Retries available" },
          { label: "Pending Pipelines", val: pendingCount, color: "text-amber-700 bg-amber-50", desc: "Awaiting gateway check" }
        ].map((c, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.label}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${c.color}`}>{c.desc}</span>
            </div>
            <h3 className="font-heading text-lg font-black text-slate-900 leading-none">{c.val}</h3>
          </div>
        ))}
      </div>

      {/* Payment Trace table container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-3 items-center">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Transaction Trace</h4>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Audit and operational pipeline keys</span>
          </div>

          {/* Filtering buttons */}
          <div className="flex gap-1.5 text-[10px] font-black uppercase select-none">
            {[
              { id: "all", label: "All Traces" },
              { id: "failed", label: "Failed Logs" },
              { id: "refunds", label: "Refund Claims" }
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
                    No matching traces registered under the current segment.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  return (
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
                            : p.status === "refund_requested"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : p.status === "refunded"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                        }`}>{p.status.replace("_", " ")}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        {p.status === "failed" && (
                          <button
                            onClick={() => retryPayment(p.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-2 py-1 rounded font-black uppercase cursor-pointer transition-all shadow-sm"
                          >
                            Retry Payment
                          </button>
                        )}
                        {p.status === "refund_requested" && (
                          <button
                            onClick={() => processRefund(p.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] px-2 py-1 rounded font-black uppercase cursor-pointer transition-all shadow-sm"
                          >
                            Process Refund
                          </button>
                        )}
                        {p.status !== "failed" && p.status !== "refund_requested" && (
                          <span className="text-[10px] text-slate-400">Locked Ledger</span>
                        )}
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

export default AdminPaymentsTab;
