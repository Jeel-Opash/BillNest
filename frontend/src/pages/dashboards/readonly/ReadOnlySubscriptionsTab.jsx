import React, { useState } from "react";

const ReadOnlySubscriptionsTab = ({
  clients
}) => {
  // Available plans list
  const plans = [
    { name: "Starter Tier", price: 2900, cycle: "monthly", features: ["Up to 10 clients", "Basic invoicing", "Email support"] },
    { name: "Growth Plan", price: 9900, cycle: "monthly", features: ["Unlimited clients", "Recurrence engine", "Stripe portal"] },
    { name: "Enterprise Suite", price: 29000, cycle: "yearly", features: ["Dedicated servers", "API endpoints", "SLA guarantees"] }
  ];

  // Mock active client subscriptions
  const [subscriptions] = useState([
    { id: "sub_1", client: "ABC Restaurant", plan: "Growth Plan", price: 9900, cycle: "monthly", renewalDate: "2026-07-02", status: "active", revenueGenerated: 39600 },
    { id: "sub_2", client: "Pixel Studio", plan: "Starter Tier", price: 2900, cycle: "monthly", renewalDate: "2026-06-25", status: "paused", revenueGenerated: 11600 }
  ]);

  const [filterPlan, setFilterPlan] = useState("all");

  const filteredSubs = subscriptions.filter(s => filterPlan === "all" || s.plan === filterPlan);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Subscription tables */}
      <div className="lg:col-span-8 space-y-6">

        {/* Read-Only Safeguard Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
          <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Subscription Configuration Constraints</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
              Read-Only credentials allow auditing subscription tiers and renewal dates. Modifying agreements, canceling client plans, or creating custom organization packages is locked.
            </p>
          </div>
        </div>

        {/* Plan Filters */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap gap-2 text-xs font-semibold select-none">
          <button
            onClick={() => setFilterPlan("all")}
            className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              filterPlan === "all"
                ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            All Subscriptions
          </button>
          {plans.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setFilterPlan(p.name)}
              className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                filterPlan === p.name
                  ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Active roster */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Assigned Subscriptions</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredSubs.length} schedules
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredSubs.map(s => (
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
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Next Renewal Stamp: {s.renewalDate} | Collected: ₹{s.revenueGenerated.toLocaleString()}</p>
                </div>

                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                  <h5 className="font-black text-slate-900 text-xs">₹{s.price.toLocaleString()}</h5>
                  
                  <div className="flex gap-1.5 select-none">
                    {/* Modification actions explicitly locked */}
                    <div
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-400 text-[10px] font-black uppercase cursor-not-allowed border border-transparent"
                      title="Subscription alterations restricted"
                    >
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Cancel Subscription
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right side: visual pricing guide */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4 select-none">
          Organization Plans Reference
        </h4>

        <div className="space-y-3.5">
          {plans.map((p, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-black text-slate-800 text-xs">{p.name}</span>
                <span className="text-indigo-600 font-black text-xs">₹{p.price.toLocaleString()} / {p.cycle}</span>
              </div>
              <ul className="space-y-1">
                {p.features.slice(0, 2).map((feat, i) => (
                  <li key={i} className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="material-symbols-outlined text-[10px] text-indigo-500 font-bold">check</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ReadOnlySubscriptionsTab;
