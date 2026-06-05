import React, { useState } from "react";
import StripeCheckoutModal from "../../../components/StripeCheckoutModal";

const MemberSubscriptionsTab = ({
  user,
  clients,
  payments = [],
  setPayments,
  showToast
}) => {

  const plans = [
    { name: "Starter Tier", price: 2900, cycle: "monthly", features: ["Up to 10 clients", "Basic invoicing", "Email support"] },
    { name: "Growth Plan", price: 9900, cycle: "monthly", features: ["Unlimited clients", "Recurrence engine", "Stripe portal"] },
    { name: "Enterprise Suite", price: 29000, cycle: "yearly", features: ["Dedicated servers", "API endpoints", "SLA guarantees"] }
  ];


  const [subscriptions, setSubscriptions] = useState([
    { id: "sub_1", client: "ABC Restaurant", plan: "Growth Plan", price: 9900, cycle: "monthly", renewalDate: "2026-07-02", status: "active" },
    { id: "sub_2", client: "Pixel Studio", plan: "Starter Tier", price: 2900, cycle: "monthly", renewalDate: "2026-06-25", status: "paused" }
  ]);

  const [targetClient, setTargetClient] = useState(clients[0]?.company || "");
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [customRenewal, setCustomRenewal] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);

  const handlePlanSelectClick = (plan) => {
    setSelectedPlan(plan);
    const clientName = targetClient || (clients[0]?.company || "ABC Restaurant");
    const clientEmail = clients.find(c => c.company === clientName)?.email || "billing@client.com";
    
    const mockInv = {
      id: `SUB-PAY-${Date.now()}`,
      amount: plan.price,
      client: clientName,
      clientEmail: clientEmail,
      items: [{ desc: `${plan.name} Subscription`, qty: 1, price: plan.price }]
    };
    setCheckoutInvoice(mockInv);
    setIsCheckoutOpen(true);
  };

  const handleCreateSubscription = (e) => {
    e.preventDefault();
    if (!targetClient) {
      showToast("Please register a client first.", "warning");
      return;
    }

    if (subscriptions.some(s => s.client === targetClient && s.status !== "cancelled")) {
      showToast(`Client ${targetClient} already has an active subscription.`, "warning");
      return;
    }

    const clientEmail = clients.find(c => c.company === targetClient)?.email || "billing@client.com";
    
    const mockInv = {
      id: `SUB-PAY-${Date.now()}`,
      amount: selectedPlan.price,
      client: targetClient,
      clientEmail: clientEmail,
      items: [{ desc: `${selectedPlan.name} Subscription`, qty: 1, price: selectedPlan.price }]
    };
    setCheckoutInvoice(mockInv);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (txn) => {
    const newSub = {
      id: `sub_${Date.now()}`,
      client: txn.client || targetClient || "ABC Restaurant",
      plan: selectedPlan.name,
      price: selectedPlan.price,
      cycle: selectedPlan.cycle,
      renewalDate: customRenewal,
      status: "active"
    };
    setSubscriptions([newSub, ...subscriptions]);

    const orgKey = user?.organization?.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "guest";
    const existingPayments = JSON.parse(localStorage.getItem(`workspace_shared_payments_${orgKey}`) || "[]");
    
    const newPayment = {
      id: txn.txnId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoice: txn.invoice || `SUB-PAY-${Date.now()}`,
      client: txn.client || targetClient || "ABC Restaurant",
      method: txn.method || "Stripe Card",
      amount: txn.amount || selectedPlan.price,
      status: "successful",
      date: txn.date || new Date().toISOString().split("T")[0]
    };

    const updatedPayments = [newPayment, ...existingPayments];
    localStorage.setItem(`workspace_shared_payments_${orgKey}`, JSON.stringify(updatedPayments));

    if (setPayments) {
      setPayments(updatedPayments);
    }

    showToast(`Subscription assigned & payment of ₹${selectedPlan.price.toLocaleString()} succeeded via Stripe!`, "success");
    setIsCheckoutOpen(false);
  };

  const handlePause = (id) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: "paused" } : s));
    showToast("Subscription schedule paused.", "info");
  };

  const handleResume = (id) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: "active" } : s));
    showToast("Subscription schedule resumed.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Plans & active roster */}
      <div className="lg:col-span-8 space-y-6">

        {/* Member limitations safeguard callout */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
          <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Subscription Configuration Guard</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
              Workspace Members can assign pre-authorized pricing plans to client files and adjust timelines. Generating new organization pricing tiers or editing global Stripe gateway structures is restricted.
            </p>
          </div>
        </div>

        {/* Available plans grid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
            Authorized System Plans
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
                <div>
                  <h5 className="font-heading font-black text-slate-900 text-xs">{p.name}</h5>
                  <h3 className="font-heading text-xl font-black text-indigo-600 mt-2">
                    ₹{p.price.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold font-sans">/ {p.cycle}</span>
                  </h3>
                  <ul className="space-y-1.5 mt-3.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                        <span className="material-symbols-outlined text-[12px] text-indigo-500 font-bold">check</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelectClick(p)}
                  className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    selectedPlan.name === p.name
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {selectedPlan.name === p.name ? "Selected" : "Select Tier"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned subscriptions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Client Subscription History</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {subscriptions.length} active dispatches
            </span>
          </div>

          <div className="space-y-3.5">
            {subscriptions.map(s => (
              <div key={s.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm leading-none">{s.client}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>{s.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5 font-sans">Tier Plan: <strong className="text-slate-800">{s.plan}</strong></p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Renewal Stamp: {s.renewalDate}</p>
                </div>

                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                  <h5 className="font-black text-slate-900 text-xs">₹{s.price.toLocaleString()}</h5>
                  
                  <div className="flex gap-1.5">
                    {s.status === "active" ? (
                      <button
                        onClick={() => handlePause(s.id)}
                        className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer"
                      >
                        Pause Sub
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResume(s.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer shadow-sm"
                      >
                        Resume Sub
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right side: assign form panel */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Assign Plan Subscription
        </h4>

        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Select Client Target</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
              value={targetClient}
              onChange={(e) => setTargetClient(e.target.value)}
            >
              {clients.map(c => (
                <option key={c.id} value={c.company}>{c.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Plan Value Mapping</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold space-y-1">
              <span className="text-slate-800 font-black block">{selectedPlan.name}</span>
              <span className="text-indigo-600 block">₹{selectedPlan.price.toLocaleString()} / {selectedPlan.cycle}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Renewal Date</label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold cursor-pointer outline-none text-slate-700"
              value={customRenewal}
              onChange={(e) => setCustomRenewal(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            Assign client subscription
          </button>
        </form>
      </div>

      {isCheckoutOpen && checkoutInvoice && (
        <StripeCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
          onFailure={() => showToast("Subscription payment verification failed.", "error")}
          invoice={checkoutInvoice}
        />
      )}
    </div>
  );
};

export default MemberSubscriptionsTab;
