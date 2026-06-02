import React, { useState, useMemo } from "react";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const PaymentsTab = ({
  user,
  payments = [],
  setPayments,
  invoices = [],
  setInvoices,
  showToast
}) => {
  const [activeSegment, setActiveSegment] = useState("all"); // all, succeeded, failed, refunded, stripe
  const [selectedStripeLog, setSelectedStripeLog] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState("Duplicate charge");

  // Simulated Stripe Event Logs for the Stripe Transactions Sub-tab
  const [stripeLogs] = useState([
    {
      id: "evt_3N5b9eLkdIwEfV1a2jK0x9pQ",
      type: "payment_intent.succeeded",
      created: "2026-05-20T14:32:00Z",
      livemode: true,
      api_version: "2023-10-16",
      data: {
        object: {
          id: "pi_3N5b9eLkdIwEfV1a",
          amount: 1500000, // in cents
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
    },
    {
      id: "evt_3N5b8fLkdIwEfV1b1jZ9x8wR",
      type: "payment_intent.payment_failed",
      created: "2026-05-15T09:12:00Z",
      livemode: true,
      api_version: "2023-10-16",
      data: {
        object: {
          id: "pi_3N5b8fLkdIwEfV1b",
          amount: 500000,
          currency: "inr",
          last_payment_error: {
            code: "card_declined",
            decline_code: "insufficient_funds",
            message: "The card has insufficient funds to complete this transaction."
          },
          status: "requires_payment_method"
        }
      }
    }
  ]);

  // --- Metrics Calculations ---
  
  // Total Collected (Sum of succeeded payments, excluding any that were refunded)
  const totalCollected = useMemo(() => {
    return payments
      .filter(p => p.status?.toLowerCase() === "succeeded")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  // Pending Payments (Sum of invoices that are sent or overdue)
  const pendingPayments = useMemo(() => {
    return invoices
      .filter(inv => inv.status?.toLowerCase() === "sent" || inv.status?.toLowerCase() === "overdue")
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }, [invoices]);

  // Failed Payments (Sum of all failed payments)
  const failedPaymentsSum = useMemo(() => {
    return payments
      .filter(p => p.status?.toLowerCase() === "failed")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  // Refunded Amount (Sum of all payments with status refunded)
  const refundedAmount = useMemo(() => {
    return payments
      .filter(p => p.status?.toLowerCase() === "refunded")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  // --- Filtering ---
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (activeSegment === "all") return true;
      return p.status?.toLowerCase() === activeSegment.toLowerCase();
    });
  }, [payments, activeSegment]);

  // --- Refund Handler ---
  const handleProcessRefundSubmit = (e) => {
    e.preventDefault();
    if (!refundTarget) return;

    // 1. Update the payment record to "refunded"
    setPayments(payments.map(p => {
      if (p.id === refundTarget.id) {
        return { ...p, status: "refunded", refundReason: refundReason };
      }
      return p;
    }));

    // 2. Mark the corresponding invoice as "void" or keep as "refunded"
    if (setInvoices && refundTarget.invoice) {
      setInvoices(invoices.map(inv => {
        if (inv.id === refundTarget.invoice) {
          return { ...inv, status: "void", notes: `${inv.notes || ""}\n[REFUNDED: ${refundReason}]`.trim() };
        }
        return inv;
      }));
    }

    showToast(`Refund processed successfully for Transaction ${refundTarget.id}!`, "success");
    setRefundTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header controls */}
      <div>
        <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Payments Command Center</h3>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Review processed receipts, trigger instant refunds, and audit raw Stripe webhook event logs.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Total Collected</p>
            <h3 className="text-2xl font-black text-slate-950">{formatCurrency(totalCollected)}</h3>
          </div>
          <span className="text-[9px] text-emerald-600 font-bold block mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Cleared through Stripe
          </span>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Pending Payments</p>
            <h3 className="text-2xl font-black text-indigo-600">{formatCurrency(pendingPayments)}</h3>
          </div>
          <span className="text-[9px] text-slate-400 font-bold block mt-3">
            Outstanding invoices balance
          </span>
        </div>

        {/* Failed Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Failed Payments</p>
            <h3 className="text-2xl font-black text-rose-600">{formatCurrency(failedPaymentsSum)}</h3>
          </div>
          <span className="text-[9px] text-rose-500 font-bold block mt-3 flex items-center gap-1">
            {payments.filter(p => p.status?.toLowerCase() === "failed").length} transaction attempts declined
          </span>
        </div>

        {/* Refund Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Refunded Amount</p>
            <h3 className="text-2xl font-black text-amber-600">{formatCurrency(refundedAmount)}</h3>
          </div>
          <span className="text-[9px] text-amber-600 font-bold block mt-3 flex items-center gap-1">
            {payments.filter(p => p.status?.toLowerCase() === "refunded").length} processed reversals
          </span>
        </div>

      </div>

      {/* Transaction Register Block */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-3 gap-3">
          <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Accounting Statements</h4>
          
          <div className="flex flex-wrap bg-slate-50 border border-slate-200/60 p-1 rounded-xl gap-1">
            {[
              { id: "all", label: "All Logs" },
              { id: "succeeded", label: "History" },
              { id: "failed", label: "Declines" },
              { id: "refunded", label: "Refunds" },
              { id: "stripe", label: "Stripe Webhooks" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSegment(tab.id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeSegment === tab.id ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Segment 1: Payments Tables (all, succeeded, failed, refunded) */}
        {activeSegment !== "stripe" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">
                  <th className="p-3 pl-4">Transaction ID</th>
                  <th className="p-3">Client Partner</th>
                  <th className="p-3">Reference invoice</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p, idx) => {
                    const isSucceeded = p.status?.toLowerCase() === "succeeded";
                    const isFailed = p.status?.toLowerCase() === "failed";
                    const isRefunded = p.status?.toLowerCase() === "refunded";

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-900">{p.id}</td>
                        <td className="p-3 font-bold text-slate-800">{p.client}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600 hover:underline cursor-pointer">{p.invoice}</td>
                        <td className="p-3 text-slate-500 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">credit_card</span>
                          {p.method || "Stripe Card"}
                        </td>
                        <td className="p-3 text-slate-400">{p.date}</td>
                        <td className="p-3 font-black text-slate-950">{formatCurrency(p.amount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            isSucceeded 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : isFailed 
                                ? "bg-rose-50 text-rose-700 border-rose-100" 
                                : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          {isSucceeded && (
                            <button
                              onClick={() => {
                                setRefundTarget(p);
                                setRefundReason("Customer request");
                              }}
                              className="text-amber-600 hover:text-amber-800 font-black text-[10px] uppercase border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                          {isRefunded && p.refundReason && (
                            <span className="text-[9px] text-slate-400 font-bold italic" title={p.refundReason}>
                              Ref: {p.refundReason}
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-[9px] text-rose-400 font-bold italic">
                              Decline: Insufficient Funds
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-400 font-semibold italic border-2 border-dashed border-slate-50 rounded-2xl">
                      No transaction records match the active segment criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Segment 2: Raw Stripe Webhook Logs
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl">
              <span className="material-symbols-outlined text-[16px] animate-pulse">settings_ethernet</span>
              <span>Developer Audit: Below are raw JSON payloads captured by the BillNest Stripe Webhook receiver. Use these details to analyze status changes or debug integration integrations.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Event Logs List */}
              <div className="lg:col-span-1 border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden">
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
              </div>

              {/* Event Detail JSON viewer */}
              <div className="lg:col-span-2 bg-slate-950 text-slate-350 p-5 rounded-2xl border border-slate-900 font-mono text-[11px] overflow-x-auto shadow-inner relative flex flex-col justify-between gap-4">
                <div className="absolute top-3 right-3 text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-widest">
                  JSON Payload
                </div>

                {selectedStripeLog ? (
                  <pre className="text-emerald-400 leading-relaxed font-semibold">
                    {JSON.stringify(selectedStripeLog, null, 2)}
                  </pre>
                ) : (
                  <div className="py-20 text-center text-slate-500 font-semibold italic">
                    Select a Stripe transaction webhook event from the left panel to inspect the cryptographic payload details.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ==================== REFUND CONFIRMATION MODAL ==================== */}
      {refundTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-950">Process Transaction Reversal</h4>
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider mt-0.5">WARNING: This action performs an instant refund in Stripe.</p>
              </div>
              <button
                onClick={() => setRefundTarget(null)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleProcessRefundSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <span>Transaction Target</span>
                  <span className="font-mono text-slate-900">{refundTarget.id}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-500">Client Partner:</span>
                  <span className="text-slate-800">{refundTarget.client}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-500">Refund Value:</span>
                  <span className="text-slate-950 text-sm font-black">{formatCurrency(refundTarget.amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Reason for Reversal</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                >
                  <option value="Duplicate charge">Duplicate charge</option>
                  <option value="Customer request">Customer request</option>
                  <option value="Fraudulent transaction">Fraudulent transaction</option>
                  <option value="System glitch">System glitch</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Keep Charge
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Release Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentsTab;
