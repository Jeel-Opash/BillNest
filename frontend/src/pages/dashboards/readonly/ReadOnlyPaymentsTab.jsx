import React, { useState, useMemo, useEffect } from "react";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const ReadOnlyPaymentsTab = ({ payments = [], user }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStripeLog, setSelectedStripeLog] = useState(null);

  // Load simulated Stripe webhook logs from local storage (synced with checkout modal)
  const [stripeLogs, setStripeLogs] = useState([]);

  useEffect(() => {
    const email = user?.email || "guest";
    try {
      const saved = localStorage.getItem(`workspace_${email}_stripe_logs`);
      if (saved) {
        setStripeLogs(JSON.parse(saved));
      } else {
        // Fallback default logs
        const defaultLogs = [
          {
            id: "evt_3N5b9eLkdIwEfV1a2jK0x9pQ",
            type: "payment_intent.succeeded",
            created: "2026-05-20T14:32:00Z",
            livemode: true,
            api_version: "2023-10-16",
            data: {
              object: {
                id: "pi_3N5b9eLkdIwEfV1a",
                amount: 1500000,
                currency: "inr",
                payment_method_types: ["card"],
                status: "succeeded",
                charges: {
                  data: [
                    {
                      id: "ch_3N5b9eLkdIwEfV1a",
                      receipt_url: "https://stripe.com/receipt/ch_3N5b9eLkdIwEfV1a",
                      billing_details: { email: "finance@pixelstudio.com", name: "Pixel Creative Labs" }
                    }
                  ]
                }
              }
            }
          }
        ];
        setStripeLogs(defaultLogs);
        localStorage.setItem(`workspace_${email}_stripe_logs`, JSON.stringify(defaultLogs));
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
    }
  }, [user]);

  // Listen to local storage changes to update live logs in real time
  useEffect(() => {
    const handleStorageChange = (e) => {
      const email = user?.email || "guest";
      if (e.key === `workspace_${email}_stripe_logs`) {
        try {
          setStripeLogs(JSON.parse(e.newValue || "[]"));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (activeTab === "all") return true;
      if (activeTab === "successful") return p.status?.toLowerCase() === "succeeded" || p.status?.toLowerCase() === "successful";
      if (activeTab === "failed") return p.status?.toLowerCase() === "failed";
      if (activeTab === "refunded") return p.status?.toLowerCase() === "refunded";
      return p.status?.toLowerCase() === activeTab.toLowerCase();
    });
  }, [payments, activeTab]);

  const totalPayments = payments.length;
  
  const revenueCollected = useMemo(() => {
    return payments
      .filter(p => p.status?.toLowerCase() === "succeeded" || p.status?.toLowerCase() === "successful")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [payments]);

  const failedTransactions = useMemo(() => {
    return payments.filter(p => p.status?.toLowerCase() === "failed").length;
  }, [payments]);

  const collectionRate = useMemo(() => {
    if (totalPayments === 0) return "100%";
    const success = payments.filter(p => p.status?.toLowerCase() === "succeeded" || p.status?.toLowerCase() === "successful").length;
    return `${Math.round((success / totalPayments) * 100)}%`;
  }, [payments, totalPayments]);

  return (
    <div className="space-y-6">

      {/* Constraints banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
        <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
        <div>
          <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Transactional Gateways Constraints</h5>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
            Your observer credentials allow complete inspection of Stripe records. Manually retrying failed checkouts or processing client refunds is restricted.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions Mapped", val: totalPayments, color: "text-indigo-600 bg-indigo-50" },
          { label: "Revenue Collected", val: formatCurrency(revenueCollected), color: "text-emerald-600 bg-emerald-50" },
          { label: "Failed Transactions", val: failedTransactions, color: "text-rose-600 bg-rose-50" },
          { label: "Collection Success Rate", val: collectionRate, color: "text-emerald-600 bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-2.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
            <h4 className="font-heading text-lg font-black text-slate-900 leading-none">{stat.val}</h4>
          </div>
        ))}
      </div>

      {/* Transaction log lists */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-3 items-center">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Payments Ledger Logs</h4>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Audit and transaction reference tags</span>
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap gap-1 text-[10px] font-black uppercase select-none">
            {[
              { id: "all", label: "All Traces" },
              { id: "successful", label: "Successful" },
              { id: "failed", label: "Failed Logs" },
              { id: "refunded", label: "Refunds History" },
              { id: "stripe", label: "Stripe Webhooks" }
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

        {/* Transactions list / Webhook logs */}
        {activeTab !== "stripe" ? (
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
                      No matching payments registered.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => {
                    const isSuccess = p.status?.toLowerCase() === "succeeded" || p.status?.toLowerCase() === "successful";
                    const isFailed = p.status?.toLowerCase() === "failed";
                    const isRefunded = p.status?.toLowerCase() === "refunded";

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">{p.id}</td>
                        <td className="py-3.5 text-slate-800">{p.client}</td>
                        <td className="py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{p.method || "Stripe Card"}</td>
                        <td className="py-3.5 text-slate-400">{p.date}</td>
                        <td className="py-3.5 font-black text-slate-900">{formatCurrency(p.amount)}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : isFailed
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>{p.status}</span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-0.5 select-none">
                            <span className="material-symbols-outlined text-[14px]">lock_outline</span>
                            Audit Locked
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl">
              <span className="material-symbols-outlined text-[16px] animate-pulse">settings_ethernet</span>
              <span>Developer Audit: Below are raw JSON payloads captured by the BillNest Stripe Webhook receiver in the shared multi-tenant space.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Logs List */}
              <div className="lg:col-span-1 border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden max-h-[300px] overflow-y-auto">
                {stripeLogs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedStripeLog(log)}
                    className={`w-full text-left p-3.5 flex flex-col gap-1 transition-all outline-none ${
                      selectedStripeLog?.id === log.id 
                        ? "bg-slate-900 text-white" 
                        : "bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-mono text-[9px] font-bold tracking-wider opacity-60">{log.id}</span>
                    <span className="text-xs font-black">{log.type}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-50 mt-1">{log.created}</span>
                  </button>
                ))}
                {stripeLogs.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic">No webhook events recorded.</div>
                )}
              </div>

              {/* Event Detail JSON viewer */}
              <div className="lg:col-span-2 bg-slate-950 text-slate-350 p-5 rounded-2xl border border-slate-900 font-mono text-[11px] overflow-x-auto shadow-inner relative flex flex-col justify-between gap-4 min-h-[250px]">
                <div className="absolute top-3 right-3 text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-widest">
                  JSON Payload
                </div>

                {selectedStripeLog ? (
                  <pre className="text-emerald-400 leading-relaxed font-semibold">
                    {JSON.stringify(selectedStripeLog, null, 2)}
                  </pre>
                ) : (
                  <div className="py-12 text-center text-slate-500 font-semibold italic my-auto">
                    Select a Stripe transaction webhook event from the left panel to inspect the cryptographic payload details.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ReadOnlyPaymentsTab;
