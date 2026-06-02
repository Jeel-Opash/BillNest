import React, { useState } from "react";

const OverviewTab = ({ paidValue, mrrValue, outstandingValue, user }) => {
  // State for interactive SaaS growth simulator
  const [simCustomers, setSimCustomers] = useState(48);
  const [simPrice, setSimPrice] = useState(3000);
  const [simSignups, setSimSignups] = useState(5);
  const [simChurn, setSimChurn] = useState(4);

  // State for simulated webhook event tester
  const [selectedEvent, setSelectedEvent] = useState("invoice.payment_succeeded");
  const [webhookLogs, setWebhookLogs] = useState([
    { id: "w1", event: "invoice.payment_succeeded", status: "delivered", time: "Just now", payload: "inv_stripe_88f2" },
    { id: "w2", event: "charge.succeeded", status: "delivered", time: "12 mins ago", payload: "ch_stripe_991b" },
    { id: "w3", event: "invoice.payment_failed", status: "retrying", time: "1 hour ago", payload: "inv_stripe_77x1" }
  ]);

  // Brand Accent State
  const [brandColor, setBrandColor] = useState("indigo");

  const brandColors = {
    indigo: { primary: "indigo-600", bg: "indigo-50", text: "indigo-700", border: "indigo-100", hex: "#4f46e5" },
    emerald: { primary: "emerald-600", bg: "emerald-50", text: "emerald-700", border: "emerald-100", hex: "#10b981" },
    violet: { primary: "violet-600", bg: "violet-50", text: "violet-700", border: "violet-100", hex: "#8b5cf6" },
    rose: { primary: "rose-600", bg: "rose-50", text: "rose-700", border: "rose-100", hex: "#f43f5e" },
    amber: { primary: "amber-600", bg: "amber-50", text: "amber-700", border: "amber-100", hex: "#f59e0b" }
  };

  const activeTheme = brandColors[brandColor] || brandColors.indigo;

  // SaaS Simulator calculations
  const currentSimMrr = simCustomers * simPrice;
  const churnedCustomersCount = Math.round(simCustomers * (simChurn / 100));
  const nextMonthCustomers = Math.max(0, simCustomers + simSignups - churnedCustomersCount);
  const nextMonthSimMrr = nextMonthCustomers * simPrice;
  const arrValue = currentSimMrr * 12;
  const monthlyChurnLoss = churnedCustomersCount * simPrice;

  const topClients = [
    { name: "ABC Food & Beverages", revenue: 342200, share: 42, tier: "enterprise" },
    { name: "Pixel Creative Labs", revenue: 188000, share: 24, tier: "growth" },
    { name: "Nova Tech Ltd", revenue: 151500, share: 19, tier: "growth" },
    { name: "Harbor Studio", revenue: 84500, share: 10, tier: "starter" },
    { name: "Kirana Cloud", revenue: 42000, share: 5, tier: "starter" },
  ];

  const invoiceStatus = [
    { label: "Paid", count: 18, color: "bg-emerald-500" },
    { label: "Sent", count: 7, color: "bg-blue-500" },
    { label: "Overdue", count: 3, color: "bg-amber-500" },
    { label: "Draft", count: 5, color: "bg-slate-400" },
  ];

  const totalInvoices = invoiceStatus.reduce((sum, item) => sum + item.count, 0);

  const handleSimulateWebhook = () => {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const newLog = {
      id: `w_${Date.now()}`,
      event: selectedEvent,
      status: selectedEvent.includes("failed") ? "retrying" : "delivered",
      time: "Just now",
      payload: `stripe_evt_${randomHex}_${Date.now().toString().slice(-4)}`
    };
    setWebhookLogs([newLog, ...webhookLogs.slice(0, 4)]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header controls with brand switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl font-bold text-slate-900">Analytics Overview</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time performance metrics and advanced revenue simulations.</p>
        </div>

        {/* Live Brand accent palette picker */}
        <div className="flex items-center bg-white border border-slate-100 p-2.5 rounded-2xl gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Brand Accent</span>
          <div className="flex gap-1.5">
            {Object.keys(brandColors).map((cKey) => (
              <button
                key={cKey}
                onClick={() => setBrandColor(cKey)}
                style={{ backgroundColor: brandColors[cKey].hex }}
                className={`w-5 h-5 rounded-full transition-transform duration-150 hover:scale-110 focus:outline-none ${
                  brandColor === cKey ? "ring-2 ring-slate-800 ring-offset-2 scale-110" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Collected Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">₹{paidValue.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +12.5% vs last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Monthly Recurring Revenue</p>
            <h3 className={`text-2xl font-bold mb-4 tracking-tight text-${activeTheme.primary}`}>₹{mrrValue.toLocaleString()}</h3>
          </div>
          <div className={`flex items-center gap-1.5 text-${activeTheme.text} bg-${activeTheme.bg} text-[10px] font-bold px-2 py-1 rounded-lg w-fit`}>
            <span className="material-symbols-outlined text-xs">autorenew</span>
            3 Active Subscriptions
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Outstanding Payments</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">₹{outstandingValue.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">hourglass_empty</span>
            Requires Dunning Action
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Active Subscriptions</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">12 Plans</h3>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">calendar_month</span>
            4 renewals due soon
          </div>
        </div>
      </div>

      {/* Main Charts & Projection Simulator */}
      <div className="grid grid-cols-12 gap-6">
        {/* SVG Revenue Graph */}
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-heading text-lg font-bold text-slate-900">Revenue Trends</h4>
              <p className="text-slate-400 text-xs mt-0.5">Past 12 months growth trajectory</p>
            </div>
            <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200/50">
              <button className={`bg-white shadow-sm text-xs font-semibold px-3 py-1 rounded-md text-${activeTheme.primary}`}>Monthly</button>
              <button className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-3 py-1 rounded-md transition-colors">Quarterly</button>
            </div>
          </div>

          <div className="h-64 relative w-full mb-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              <div className="border-b border-slate-50 w-full h-0"></div>
              <div className="border-b border-slate-50 w-full h-0"></div>
              <div className="border-b border-slate-50 w-full h-0"></div>
              <div className="border-b border-slate-50 w-full h-0"></div>
            </div>

            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeTheme.hex} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={activeTheme.hex} stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <path style={{ color: activeTheme.hex }} className="transition-all duration-300" d="M 20 80 C 80 82, 120 62, 170 70 C 220 78, 280 45, 330 48 C 380 50, 420 22, 480 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 20 80 C 80 82, 120 62, 170 70 C 220 78, 280 45, 330 48 C 380 50, 420 22, 480 18 L 480 100 L 20 100 Z" fill="url(#chartGradient)" />
              <circle cx="20" cy="80" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="170" cy="70" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="330" cy="48" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="480" cy="18" r="5" style={{ fill: activeTheme.hex, stroke: "#fff" }} strokeWidth="2" />
            </svg>

            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-2">
              <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span><span>Dec (Live)</span>
            </div>
          </div>
        </div>

        {/* Brand Accent Highlight */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h4 className="font-heading text-lg font-bold text-slate-900">Client Allocation</h4>
            <p className="text-slate-400 text-xs mt-0.5 mb-6">Service tier distribution</p>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Enterprise (Tier 3)</span>
                  <span className="text-slate-900 font-bold">45%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-${activeTheme.primary}`} style={{ width: "45%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Growth (Tier 2)</span>
                  <span className="text-slate-900 font-bold">30%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: "30%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Basic (Tier 1)</span>
                  <span className="text-slate-900 font-bold">25%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-300 h-full rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className={`border p-5 rounded-2xl flex flex-col gap-2 bg-${activeTheme.bg} border-${activeTheme.border}`}>
            <div className={`flex items-center gap-2 font-bold text-xs text-${activeTheme.text}`}>
              <span className="material-symbols-outlined text-[16px]">lightbulb</span>
              ORGANIZATION ANALYTICS
            </div>
            <p className={`text-${activeTheme.text} text-xs leading-relaxed font-semibold opacity-90`}>
              High-value conversion is up this quarter. Changing the active accent color alters brand styling across generated invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced High-level Feature: SaaS subscription growth & churn projection simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-50 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-${activeTheme.primary}`}>calculate</span>
              <h4 className="font-heading text-lg font-bold text-slate-900">SaaS Growth & Churn Projection Simulator</h4>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Drag settings to model recurring billing growth and forecast next month's MRR pipeline.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase">Monthly Run Rate (MRR)</div>
              <div className={`text-base font-black text-${activeTheme.primary}`}>₹{currentSimMrr.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase">Annualized ARR</div>
              <div className="text-base font-black text-slate-900">₹{arrValue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Sliders */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-600">Active Subscription Clients</span>
                <span className={`text-${activeTheme.primary}`}>{simCustomers} clients</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                value={simCustomers}
                onChange={(e) => setSimCustomers(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-600">Average Plan Value (Monthly)</span>
                <span className={`text-${activeTheme.primary}`}>₹{simPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Simulated New Signups</span>
                  <span className="text-slate-800">{simSignups} / mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={simSignups}
                  onChange={(e) => setSimSignups(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Target Monthly Churn</span>
                  <span className="text-rose-600">{simChurn}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simChurn}
                  onChange={(e) => setSimChurn(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-slate-50/70 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">PROJECTED NEXT MONTH METRICS</span>
              
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-xs text-slate-600">Expected Churned Users</span>
                <span className="text-xs font-bold text-rose-600">-{churnedCustomersCount} clients</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-xs text-slate-600">Estimated Churn Loss</span>
                <span className="text-xs font-bold text-rose-600">₹{monthlyChurnLoss.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-xs text-slate-600">Net Active Headcount</span>
                <span className="text-xs font-bold text-slate-900">{nextMonthCustomers} active</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Projected MRR Curve</span>
                <span className={`text-sm font-black text-emerald-600`}>₹{nextMonthSimMrr.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-2 text-[10px] text-slate-400 font-bold leading-normal">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Calculated dynamically via tenant organization pricing variables.
            </div>
          </div>
        </div>
      </div>

      {/* Advanced High-level Feature: Stripe Simulated Webhook Event Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-heading text-lg font-bold text-slate-900">Top Clients by Revenue</h4>
              <p className="text-slate-400 text-xs mt-0.5">Paid invoice revenue across this tenant workspace.</p>
            </div>
            <span className={`bg-${activeTheme.bg} text-${activeTheme.text} text-[10px] font-bold px-2 py-1 rounded-lg uppercase`}>Owner view</span>
          </div>

          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.name} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">{client.name}</span>
                    <span className="font-black text-sm text-slate-900">Rs {client.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full bg-${activeTheme.primary}`} style={{ width: `${client.share}%` }}></div>
                  </div>
                </div>
                <span className="hidden sm:inline-flex bg-slate-50 text-slate-500 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold uppercase">
                  {client.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Webhook Event Stream Tester Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-heading text-lg font-bold text-slate-900">Webhook Live Stream</h4>
              <span className="inline-flex w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <p className="text-slate-400 text-xs mb-4">Simulate Stripe transactional webhooks to test platform response and log streams.</p>

            <div className="flex gap-2 mb-4">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-indigo-500/50 outline-none text-slate-700"
              >
                <option value="invoice.payment_succeeded">invoice.payment_succeeded</option>
                <option value="invoice.payment_failed">invoice.payment_failed</option>
                <option value="charge.refunded">charge.refunded</option>
                <option value="customer.subscription.created">customer.subscription.created</option>
                <option value="customer.subscription.deleted">customer.subscription.deleted</option>
              </select>
              <button
                onClick={handleSimulateWebhook}
                className={`bg-${activeTheme.primary} hover:opacity-90 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm outline-none cursor-pointer`}
              >
                Trigger
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {webhookLogs.map((log) => (
                <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[11px] animate-fade-in">
                  <div>
                    <span className="font-mono text-slate-700 font-bold block">{log.event}</span>
                    <span className="text-slate-400 font-semibold text-[9px] font-mono">{log.payload} • {log.time}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                    log.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold leading-normal">
            Logs simulated live. Real webhooks propagate automatically through Node.js Stripe listeners.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
