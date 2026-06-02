import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboardTab = ({
  user,
  clients,
  invoices,
  teamList,
  handlePageChange,
  showToast
}) => {
  // Fetch pending requests for dashboard widget
  const [pendingRequests, setPendingRequests] = useState([]);
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get("/auth/join-requests/pending");
        if (res.data.success) {
          setPendingRequests(res.data.requests);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard pending requests:", err);
      }
    };
    if (user) {
      fetchPending();
    }
  }, [user]);

  // Compute metrics
  const totalClients = clients.length;
  const activeSubs = 3; // Mock sub count
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft").length;
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const revenueThisMonth = invoices.filter(i => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;

  return (
    <div className="flex flex-col gap-6">

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
                New candidates are requesting admission. Review, assign roles, and grant or deny access in the Access Requests Center.
              </p>
            </div>
          </div>
          <button
            onClick={() => handlePageChange("team")}
            className="bg-white text-amber-800 hover:bg-amber-50 px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer border border-transparent outline-none"
          >
            Review Candidates
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Clients", val: totalClients, icon: "group", color: "text-indigo-600 bg-indigo-50" },
          { label: "Active Subs", val: activeSubs, icon: "autorenew", color: "text-emerald-600 bg-emerald-50" },
          { label: "Pending Invs", val: pendingInvoices, icon: "hourglass_empty", color: "text-amber-600 bg-amber-50" },
          { label: "Paid Invoices", val: paidInvoices, icon: "task_alt", color: "text-emerald-600 bg-emerald-50" },
          { label: "Revenue (M)", val: `₹${revenueThisMonth.toLocaleString()}`, icon: "payments", color: "text-indigo-600 bg-indigo-50" },
          { label: "Overdue Invs", val: overdueInvoices, icon: "error_outline", color: "text-rose-600 bg-rose-50" }
        ].map((m, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{m.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.color}`}>
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
              </div>
            </div>
            <h4 className="font-heading text-lg font-black text-slate-900 leading-none">{m.val}</h4>
          </div>
        ))}
      </div>

      {/* Quick Action bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h5 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Administrative Shortcut Actions</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handlePageChange("invoices")}
            className="flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_notes</span>
            Draft New Invoice
          </button>
          <button
            onClick={() => handlePageChange("clients")}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register New Client
          </button>
          <button
            onClick={() => handlePageChange("team")}
            className="flex items-center justify-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">rule</span>
            Access Requests Center
          </button>
        </div>
      </div>

      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Revenue curve chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue Overview</h5>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Isolated multi-tenant invoice payouts</span>
            </div>
            <span className="bg-indigo-50 border border-indigo-100 text-[8px] font-black uppercase text-indigo-600 rounded px-2 py-0.5 select-none">Live Sync</span>
          </div>

          <div className="h-44 relative w-full mt-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
              <path className="text-indigo-600" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path className="fill-indigo-50/20" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20 L 400 100 L 0 100 Z" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] text-slate-400 font-extrabold uppercase mt-1">
              <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4 (Live)</span>
            </div>
          </div>
        </div>

        {/* Recent logs */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div>
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Workspace Activity</h5>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Admin action trace records</span>
          </div>

          <div className="space-y-3.5">
            {[
              { actor: "Priya Sharma", action: "Created Invoice #INV-004", time: "10m ago", tag: "success" },
              { actor: "System Agent", action: "Synced Stripe Transactions", time: "45m ago", tag: "info" },
              { actor: "Amit Kumar", action: "Modified Client Billing info", time: "2h ago", tag: "warning" }
            ].map((act, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 animate-pulse"></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 leading-snug">{act.actor} - {act.action}</p>
                  <span className="text-[9px] text-slate-400 font-bold">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardTab;
