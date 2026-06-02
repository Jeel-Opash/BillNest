import React from "react";

const ReadOnlyDashboardTab = ({
  invoices,
  clients,
  payments,
  handlePageChange
}) => {
  // Derive Executive KPIs
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
  const mrr = 24000;
  const arr = mrr * 12;
  const activeClients = clients.length;
  const activeSubs = 2;
  const outstandingInvoices = invoices.filter(i => i.status !== "paid").length;
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;
  const successRate = 98.4;

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", val: `₹${totalRevenue.toLocaleString()}`, sub: "Resolved ledger total", icon: "payments", color: "text-emerald-600 bg-emerald-50" },
          { label: "Monthly Recurring (MRR)", val: `₹${mrr.toLocaleString()}`, sub: "Monthly active schedules", icon: "cached", color: "text-indigo-600 bg-indigo-50" },
          { label: "Annual Recurring (ARR)", val: `₹${arr.toLocaleString()}`, sub: "Projected ARR volume", icon: "trending_up", color: "text-indigo-600 bg-indigo-50" },
          { label: "Active Clients", val: activeClients, sub: "Mapped workspace POCs", icon: "groups", color: "text-blue-600 bg-blue-50" },
          { label: "Active Subscriptions", val: activeSubs, sub: "Schedules active", icon: "autorenew", color: "text-indigo-600 bg-indigo-50" },
          { label: "Outstanding Invoices", val: outstandingInvoices, sub: "Invoices awaiting webhook", icon: "hourglass_empty", color: "text-amber-600 bg-amber-50" },
          { label: "Overdue Invoices", val: overdueInvoices, sub: "Past due-date limit", icon: "report_problem", color: "text-rose-600 bg-rose-50" },
          { label: "Payment Success Rate", val: `${successRate}%`, sub: "Stripe success callback ratio", icon: "verified", color: "text-emerald-600 bg-emerald-50" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <span className="material-symbols-outlined text-[16px]">{kpi.icon}</span>
              </div>
            </div>
            <div>
              <h4 className="font-heading text-lg font-black text-slate-900 leading-none">{kpi.val}</h4>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Custom SVG Growth curve */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div>
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Executive Billing Trend</h5>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Organization MRR/ARR scaling curve</span>
          </div>

          <div className="h-60 w-full relative">
            <svg className="w-full h-full text-indigo-500" preserveAspectRatio="none" viewBox="0 0 400 100">
              <path d="M 0 90 Q 50 85 100 70 T 200 75 T 300 50 T 400 20" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="fill-indigo-500/10" d="M 0 90 Q 50 85 100 70 T 200 75 T 300 50 T 400 20 L 400 100 L 0 100 Z" />
            </svg>
            <div className="absolute inset-0 flex justify-between px-2 pt-2 text-[9px] text-slate-400 font-bold select-none pointer-events-none">
              <span>Q1 2026</span>
              <span>Q2 2026 (Mid)</span>
              <span>Q3 2026 (Proj)</span>
            </div>
          </div>
        </div>

        {/* Invoice breakdown ring list */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div>
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Invoice Allocation</h5>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Distribution based on ledger states</span>
          </div>

          <div className="space-y-3.5 text-xs font-semibold">
            {[
              { label: "Paid resolved status", percent: "68%", color: "bg-emerald-500" },
              { label: "Sent / Pending Stripe", percent: "20%", color: "bg-indigo-500" },
              { label: "Overdue limits", percent: "12%", color: "bg-rose-500" }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">{stat.label}</span>
                  <span className="text-slate-900 font-extrabold">{stat.percent}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color}`} style={{ width: stat.percent }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recents list tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Invoices list */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Invoices Viewer</h5>
            <button
              onClick={() => handlePageChange("invoices")}
              className="text-[10px] font-black text-indigo-600 uppercase cursor-pointer"
            >
              Auditor Full View
            </button>
          </div>

          <div className="divide-y divide-slate-50 text-xs font-semibold">
            {invoices.slice(0, 3).map(inv => (
              <div key={inv.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{inv.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      inv.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>{inv.status}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">{inv.client}</span>
                </div>
                <span className="font-black text-slate-900">₹{inv.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments list */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Payments View</h5>
            <button
              onClick={() => handlePageChange("payments")}
              className="text-[10px] font-black text-indigo-600 uppercase cursor-pointer"
            >
              Auditor Full View
            </button>
          </div>

          <div className="divide-y divide-slate-50 text-xs font-semibold">
            {payments.slice(0, 3).map(p => (
              <div key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{p.id}</span>
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">{p.client} | {p.method}</span>
                </div>
                <span className="font-black text-slate-900">₹{p.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReadOnlyDashboardTab;
