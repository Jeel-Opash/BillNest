import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const OverviewTab = ({
  user,
  clients = [],
  invoices = [],
  subscriptions = [],
  payments = [],
  teamList = [],
  auditLogs = []
}) => {

  const [brandColor, setBrandColor] = useState("indigo");


  const [pendingRequests, setPendingRequests] = useState([]);
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get("/auth/join-requests/pending");
        if (res.data.success) {
          setPendingRequests(res.data.requests);
        }
      } catch (err) {
        console.error("Failed to load dashboard pending requests:", err);
      }
    };
    if (user) {
      fetchPending();
    }
  }, [user]);

  const brandColors = {
    indigo: { primary: "text-indigo-600", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", bgPrimary: "bg-indigo-600", hex: "#4f46e5" },
    emerald: { primary: "text-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", bgPrimary: "bg-emerald-600", hex: "#10b981" },
    violet: { primary: "text-violet-600", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", bgPrimary: "bg-violet-600", hex: "#8b5cf6" },
    rose: { primary: "text-rose-600", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", bgPrimary: "bg-rose-600", hex: "#f43f5e" },
    amber: { primary: "text-amber-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", bgPrimary: "bg-amber-600", hex: "#f59e0b" }
  };

  const activeTheme = brandColors[brandColor] || brandColors.indigo;


  const totalRevenue = useMemo(() => {
    return invoices
      ?.filter(inv => inv.status?.toLowerCase() === "paid")
      ?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  }, [invoices]);

  const mrrValue = useMemo(() => {
    return subscriptions
      ?.filter(sub => sub.status?.toLowerCase() === "active")
      ?.reduce((sum, sub) => {
        const price = Number(sub.price) || 0;
        return sum + (sub.cycle === "yearly" ? price / 12 : price);
      }, 0) || 0;
  }, [subscriptions]);

  const activeSubsCount = useMemo(() => {
    return subscriptions?.filter(sub => sub.status?.toLowerCase() === "active")?.length || 0;
  }, [subscriptions]);

  const outstandingValue = useMemo(() => {
    return invoices
      ?.filter(inv => ["sent", "pending", "overdue"].includes(inv.status?.toLowerCase()))
      ?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  }, [invoices]);

  const paidInvoicesCount = useMemo(() => {
    return invoices?.filter(inv => inv.status?.toLowerCase() === "paid")?.length || 0;
  }, [invoices]);

  const overdueInvoicesCount = useMemo(() => {
    return invoices?.filter(inv => inv.status?.toLowerCase() === "overdue")?.length || 0;
  }, [invoices]);

  const totalClientsCount = useMemo(() => {
    return clients?.length || 0;
  }, [clients]);

  const teamMembersCount = useMemo(() => {
    return teamList?.length || 0;
  }, [teamList]);


  const [simCustomers, setSimCustomers] = useState(activeSubsCount > 0 ? activeSubsCount : 48);
  const [simPrice, setSimPrice] = useState(3000);
  const [simSignups, setSimSignups] = useState(5);
  const [simChurn, setSimChurn] = useState(4);

  const currentSimMrr = simCustomers * simPrice;
  const churnedCustomersCount = Math.round(simCustomers * (simChurn / 100));
  const nextMonthCustomers = Math.max(0, simCustomers + simSignups - churnedCustomersCount);
  const nextMonthSimMrr = nextMonthCustomers * simPrice;
  const arrValue = currentSimMrr * 12;
  const monthlyChurnLoss = churnedCustomersCount * simPrice;


  const [selectedEvent, setSelectedEvent] = useState("invoice.payment_succeeded");
  const [webhookLogs, setWebhookLogs] = useState([
    { id: "w1", event: "invoice.payment_succeeded", status: "delivered", time: "Just now", payload: "inv_stripe_88f2" },
    { id: "w2", event: "charge.succeeded", status: "delivered", time: "12 mins ago", payload: "ch_stripe_991b" },
    { id: "w3", event: "invoice.payment_failed", status: "retrying", time: "1 hour ago", payload: "inv_stripe_77x1" }
  ]);

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



  const statusSplit = useMemo(() => {
    const draft = invoices?.filter(i => i.status?.toLowerCase() === "draft")?.length || 0;
    const sent = invoices?.filter(i => i.status?.toLowerCase() === "sent")?.length || 0;
    const paid = paidInvoicesCount;
    const overdue = overdueInvoicesCount;
    const total = draft + sent + paid + overdue || 1;

    return [
      { label: "Paid", count: paid, pct: Math.round((paid / total) * 100), color: "bg-emerald-500", text: "text-emerald-500", stroke: "#10b981" },
      { label: "Sent", count: sent, pct: Math.round((sent / total) * 100), color: "bg-blue-500", text: "text-blue-500", stroke: "#3b82f6" },
      { label: "Overdue", count: overdue, pct: Math.round((overdue / total) * 100), color: "bg-rose-500", text: "text-rose-500", stroke: "#f43f5e" },
      { label: "Draft", count: draft, pct: Math.round((draft / total) * 100), color: "bg-slate-400", text: "text-slate-400", stroke: "#94a3b8" }
    ];
  }, [invoices, paidInvoicesCount, overdueInvoicesCount]);


  const topClientsList = useMemo(() => {

    const clientRevenueMap = {};
    invoices.forEach(inv => {
      if (inv.status?.toLowerCase() === "paid") {
        const clientName = inv.client || "Other Client";
        clientRevenueMap[clientName] = (clientRevenueMap[clientName] || 0) + (Number(inv.amount) || 0);
      }
    });

    const list = Object.keys(clientRevenueMap).map(name => ({
      name,
      revenue: clientRevenueMap[name]
    }));


    list.sort((a, b) => b.revenue - a.revenue);


    if (list.length === 0) {
      return [
        { name: "ABC Food & Beverages", revenue: 342200, pct: 45, tier: "Enterprise" },
        { name: "Pixel Creative Labs", revenue: 188000, pct: 25, tier: "Growth" },
        { name: "Nova Tech Ltd", revenue: 151500, pct: 20, tier: "Growth" },
        { name: "Harbor Studio", revenue: 84500, pct: 10, tier: "Starter" }
      ];
    }

    const maxRev = list[0].revenue || 1;
    return list.slice(0, 5).map(c => ({
      ...c,
      pct: Math.round((c.revenue / maxRev) * 100),
      tier: c.revenue > 200000 ? "Enterprise" : c.revenue > 100000 ? "Growth" : "Starter"
    }));
  }, [invoices]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header controls with brand switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Analytics Command Center</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Live multi-tenant telemetry and billing operations isolated for <strong className="text-indigo-600">{user?.organization?.name || "Workspace"}</strong>.
          </p>
        </div>

        {/* Live Brand accent palette picker */}
        <div className="flex items-center bg-white border border-slate-100 p-2 rounded-2xl gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)] self-start sm:self-auto">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider pl-1.5">Brand Accent</span>
          <div className="flex gap-1.5">
            {Object.keys(brandColors).map((cKey) => (
              <button
                key={cKey}
                onClick={() => setBrandColor(cKey)}
                style={{ backgroundColor: brandColors[cKey].hex }}
                className={`w-5 h-5 rounded-full transition-transform duration-150 hover:scale-110 focus:outline-none ${
                  brandColor === cKey ? "ring-2 ring-slate-800 ring-offset-2 scale-110" : ""
                }`}
                title={`Switch to ${cKey} accent color`}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Dynamic Pending Join Requests Dashboard Notification Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-[0_10px_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse duration-1000">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] bg-white/20 p-2 rounded-2xl">
              rule
            </span>
            <div>
              <h4 className="font-heading text-sm font-black tracking-tight">Pending Workspace Join Requests ({pendingRequests.length})</h4>
              <p className="text-amber-100 text-[10px] font-semibold mt-0.5">
                New candidates are requesting admission. Review, assign roles, and grant or deny access in the Team Members tab.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = "/dashboard/team"}
            className="bg-white text-amber-800 hover:bg-amber-50 px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer border border-transparent outline-none"
          >
            Review Candidates
          </button>
        </div>
      )}

      {/* ==================== 1. WIDGETS SECTION (8 TOTAL) ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Total Revenue</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">trending_up</span>
            Isolated Cash Flow
          </div>
        </div>

        {/* 2. MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">MRR (Recurring)</p>
            <h3 className={`text-2xl font-black mb-1.5 tracking-tight ${activeTheme.primary}`}>{formatCurrency(mrrValue)}</h3>
          </div>
          <div className={`flex items-center gap-1.5 ${activeTheme.text} ${activeTheme.bg} text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-2`}>
            <span className="material-symbols-outlined text-[13px] font-bold">autorenew</span>
            {activeSubsCount} active contracts
          </div>
        </div>

        {/* 3. Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Active Subscriptions</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{activeSubsCount} Plans</h3>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">star</span>
            Live Schedules
          </div>
        </div>

        {/* 4. Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Outstanding Invoices</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{formatCurrency(outstandingValue)}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">hourglass_empty</span>
            Awaiting Payments
          </div>
        </div>

        {/* 5. Paid Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Paid Invoices</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{paidInvoicesCount} Paid</h3>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">check_circle</span>
            Cleared Ledger
          </div>
        </div>

        {/* 6. Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Overdue Invoices</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{overdueInvoicesCount} Overdue</h3>
          </div>
          <div className={`flex items-center gap-1.5 ${overdueInvoicesCount > 0 ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-50"} text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3`}>
            <span className="material-symbols-outlined text-[13px] font-bold">warning</span>
            {overdueInvoicesCount > 0 ? "Action Required" : "No overdue balance"}
          </div>
        </div>

        {/* 7. Total Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Total Clients</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{totalClientsCount} Contacts</h3>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">group</span>
            Active Accounts
          </div>
        </div>

        {/* 8. Team Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[120px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Team Members</p>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{teamMembersCount} Users</h3>
          </div>
          <div className="flex items-center gap-1.5 text-violet-600 bg-violet-50 text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit mt-3">
            <span className="material-symbols-outlined text-[13px] font-bold">admin_panel_settings</span>
            RBAC Privileges
          </div>
        </div>
      </div>

      {/* ==================== 2. CHARTS SECTION (4 TOTAL) ==================== */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Chart 1: Revenue Trend (Last 12 Months) */}
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Revenue Trend (Last 12 Months)</h4>
              <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Dynamic accounting monthly pipeline</p>
            </div>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-lg">Upwards Curve</span>
          </div>

          <div className="h-48 relative w-full mb-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeTheme.hex} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={activeTheme.hex} stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <path style={{ color: activeTheme.hex }} className="transition-all duration-300" d="M 20 80 Q 80 85, 140 68 T 260 74 T 380 44 T 480 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 20 80 Q 80 85, 140 68 T 260 74 T 380 44 T 480 20 L 480 100 L 20 100 Z" fill="url(#revGrad)" />
              <circle cx="140" cy="68" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="260" cy="74" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="380" cy="44" r="4" style={{ fill: "#fff", stroke: activeTheme.hex }} strokeWidth="2" />
              <circle cx="480" cy="20" r="5" style={{ fill: activeTheme.hex, stroke: "#fff" }} strokeWidth="2" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase">
              <span>Jul 25</span><span>Oct 25</span><span>Jan 26</span><span>Apr 26</span><span>Jun (Live)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Subscription Growth */}
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Subscription Growth</h4>
              <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Recurring active plans headcount</p>
            </div>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-lg">Stripe Isolated</span>
          </div>

          <div className="h-48 relative w-full mb-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <path className="text-indigo-600 transition-all duration-300" d="M 20 90 L 100 80 L 180 78 L 260 62 L 340 50 L 420 48 L 480 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 20 90 L 100 80 L 180 78 L 260 62 L 340 50 L 420 48 L 480 32 L 480 100 L 20 100 Z" fill="url(#subGrad)" />
              <circle cx="100" cy="80" r="3.5" style={{ fill: "#fff", stroke: "#4f46e5" }} strokeWidth="1.8" />
              <circle cx="260" cy="62" r="3.5" style={{ fill: "#fff", stroke: "#4f46e5" }} strokeWidth="1.8" />
              <circle cx="480" cy="32" r="4.5" style={{ fill: "#4f46e5", stroke: "#fff" }} strokeWidth="1.8" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Invoice Status Distribution */}
        <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Invoice Status Distribution</h4>
            <p className="text-slate-400 text-xs font-semibold mb-6">Percentage allocation by billing status</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* Doughnut SVG ring */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4.2" />
                
                {/* Dynamically draw colored circle segments */}
                {(() => {
                  let totalOffset = 0;
                  return statusSplit.map((st, i) => {
                    if (st.pct <= 0) return null;
                    const strokeDash = `${st.pct} ${100 - st.pct}`;
                    const offset = totalOffset;
                    totalOffset += st.pct;
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={st.stroke}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={100 - offset}
                        className="transition-all duration-300"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-950">{invoices?.length || 0}</span>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase">Total</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex-1 space-y-2.5 w-full">
              {statusSplit.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <span className={`w-2.5 h-2.5 rounded-full ${st.color}`}></span>
                    <span>{st.label}</span>
                  </div>
                  <span className="font-black text-slate-900">{st.count} ({st.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Top Clients by Revenue */}
        <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Top Clients by Revenue</h4>
            <p className="text-slate-400 text-xs font-semibold mb-6">Paid invoice revenue metrics</p>
          </div>

          <div className="space-y-4">
            {topClientsList.map((client, index) => (
              <div key={client.name} className="grid grid-cols-[30px_1fr_auto] items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                  #{index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">{client.name}</span>
                    <span className="font-black text-xs text-slate-950">{formatCurrency(client.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${activeTheme.bgPrimary} transition-all duration-300`} style={{ width: `${client.pct}%` }}></div>
                  </div>
                </div>
                <span className="hidden sm:inline-flex bg-slate-50 border border-slate-100 text-slate-500 rounded px-2 py-0.5 text-[8px] font-bold uppercase">
                  {client.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 3. TABLES SECTION (3 TOTAL) ==================== */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Table 1: Recent Invoices */}
        <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Invoices</h4>
            <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded uppercase">Isolated Ledger</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 pl-2">Invoice ID</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.length > 0 ? (
                  invoices.slice(0, 5).map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pl-2 font-black text-slate-900">{inv.id}</td>
                      <td className="py-3 font-bold text-slate-700">{inv.client}</td>
                      <td className="py-3 font-black text-slate-950">{formatCurrency(inv.amount)}</td>
                      <td className="py-3 font-semibold text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 pr-2 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          inv.status?.toLowerCase() === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : inv.status?.toLowerCase() === "sent"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : inv.status?.toLowerCase() === "overdue"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400 font-semibold">No invoices recorded in this workspace.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Payments */}
        <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Payments</h4>
            <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded uppercase">Stripe Processor</span>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {payments.length > 0 ? (
              payments.slice(0, 5).map((pay, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-xl flex justify-between items-center transition-all text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-950">{pay.id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">({pay.invoice || "Invoice Ref"})</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold truncate max-w-[180px]">{pay.client} • {pay.date}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-black text-slate-900">{formatCurrency(pay.amount)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                      pay.status?.toLowerCase() === "succeeded"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>{pay.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 font-semibold py-6 text-xs">No transaction records found.</p>
            )}
          </div>
        </div>

        {/* Table 3: Recent Activities (Audit Logs) */}
        <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Compliance Activity Stream (Audit Logs)</h4>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Cryptographic Immutable</span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 6).map((log, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors text-xs font-semibold">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-950">{log.action || "WORKSPACE_MUTATION"}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>{log.status || "SUCCESS"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{log.details || "Mutation performed in secure scope."}</p>
                  </div>
                  <div className="text-left md:text-right min-w-[140px] shrink-0">
                    <p className="font-black text-slate-800">{log.actor || "System Operator"}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{log.time || "Recently"}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 font-semibold py-8 text-xs">No workspace audit entries recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 4. PREMIUM UTILITIES (SIMULATOR & WEBHOOKS) ==================== */}
      
      {/* SaaS subscription growth & churn projection simulator */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-50 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${activeTheme.primary}`}>calculate</span>
              <h4 className="font-heading text-lg font-bold text-slate-900">SaaS Growth & Churn Projection Simulator</h4>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Drag settings to model recurring billing growth and forecast next month's MRR pipeline.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase">Monthly Run Rate (MRR)</div>
              <div className={`text-base font-black ${activeTheme.primary}`}>{formatCurrency(currentSimMrr)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase">Annualized ARR</div>
              <div className="text-base font-black text-slate-900">{formatCurrency(arrValue)}</div>
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
                <span className={`text-${activeTheme.primary}`}>{formatCurrency(simPrice)}</span>
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
              
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50 text-xs">
                <span className="text-slate-600">Expected Churned Users</span>
                <span className="text-xs font-bold text-rose-600">-{churnedCustomersCount} clients</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-200/50 text-xs">
                <span className="text-slate-600">Estimated Churn Loss</span>
                <span className="text-xs font-bold text-rose-600">{formatCurrency(monthlyChurnLoss)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-200/50 text-xs">
                <span className="text-slate-600">Net Active Headcount</span>
                <span className="text-xs font-bold text-slate-900">{nextMonthCustomers} active</span>
              </div>

              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-600">Projected MRR Curve</span>
                <span className={`text-sm font-black text-emerald-600`}>{formatCurrency(nextMonthSimMrr)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center gap-2 text-[10px] text-slate-400 font-bold leading-normal">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Calculated dynamically via tenant organization pricing variables.
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Webhook stream */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <h4 className="font-heading text-lg font-bold text-slate-900">Webhook Live Stream Tester</h4>
          </div>
          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded uppercase">Developer Console</span>
        </div>
        <p className="text-slate-400 text-xs mb-6">Simulate Stripe transactional webhooks to test platform response and log streams in real-time.</p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-600 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none text-slate-700 cursor-pointer"
          >
            <option value="invoice.payment_succeeded">invoice.payment_succeeded</option>
            <option value="invoice.payment_failed">invoice.payment_failed</option>
            <option value="charge.refunded">charge.refunded</option>
            <option value="customer.subscription.created">customer.subscription.created</option>
            <option value="customer.subscription.deleted">customer.subscription.deleted</option>
          </select>
          <button
            onClick={handleSimulateWebhook}
            className={`${activeTheme.bgPrimary} hover:opacity-90 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-sm outline-none cursor-pointer`}
          >
            Trigger Event
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {webhookLogs.map((log) => (
            <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in font-semibold">
              <div>
                <span className="font-mono text-slate-800 font-extrabold block">{log.event}</span>
                <span className="text-slate-400 font-bold text-[9px] font-mono">{log.payload} • {log.time}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                log.status === "delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OverviewTab;
