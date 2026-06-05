import React from "react";

const MemberDashboardTab = ({
  user,
  clients,
  invoices,
  handlePageChange,
  showToast
}) => {

  const myClientsCount = clients.length;
  const myInvoicesCount = invoices.length;
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft").length;
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const revenueThisMonth = invoices.filter(i => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "My Clients", val: myClientsCount, icon: "groups", color: "text-indigo-600 bg-indigo-50" },
          { label: "My Invoices", val: myInvoicesCount, icon: "receipt_long", color: "text-blue-600 bg-blue-50" },
          { label: "Pending Invs", val: pendingInvoices, icon: "hourglass_top", color: "text-amber-600 bg-amber-50" },
          { label: "Paid Invoices", val: paidInvoices, icon: "check_circle", color: "text-emerald-600 bg-emerald-50" },
          { label: "My Generated Revenue", val: `₹${revenueThisMonth.toLocaleString()}`, icon: "payments", color: "text-indigo-600 bg-indigo-50" }
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

      {/* Shortcuts & Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left side: Recent Invoices & Assigned Tasks */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Invoices Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">My Recent Invoices</h5>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Isolated member context drafts and dispatches</span>
              </div>
              <button 
                onClick={() => handlePageChange("invoices")}
                className="text-[10px] font-black text-indigo-600 uppercase hover:text-indigo-800 cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {invoices.slice(0, 3).map(inv => (
                <div key={inv.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-xs">{inv.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>{inv.status}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-1 block">Client: {inv.client}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-xs">₹{inv.amount.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Due: {inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Tasks Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">My Assigned Tasks</h5>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Administrative action directives</span>
            </div>

            <div className="space-y-3">
              {[
                { desc: "Audit tax codes for Pixel Creative Labs", priority: "High", target: "Today" },
                { desc: "Draft recurring consultancy invoice #INV-1027", priority: "Medium", target: "Tomorrow" },
                { desc: "Update Point of Contact phone for Nova Software", priority: "Low", target: "Jun 10" }
              ].map((task, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex gap-2.5 items-center">
                    <span className={`w-2 h-2 rounded-full ${
                      task.priority === "High" ? "bg-rose-500" : task.priority === "Medium" ? "bg-amber-500" : "bg-slate-400"
                    }`}></span>
                    <span className="text-xs text-slate-700 font-semibold">{task.desc}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{task.target}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right side: Client Activities & Due Payments */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upcoming Due Payments */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Upcoming Due Payments</h5>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Payments scheduled for automatic collection</span>
            </div>

            <div className="space-y-3">
              {invoices.filter(i => i.status === "sent" || i.status === "overdue").map(inv => (
                <div key={inv.id} className="p-3 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{inv.id}</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{inv.client}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-600 block">₹{inv.amount.toLocaleString()}</span>
                    <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 block mt-1 w-fit ml-auto">
                      Due {inv.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Client Activities */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Client Activity Logs</h5>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Assigned account changes</span>
            </div>

            <div className="space-y-3">
              {[
                { detail: "ABC Restaurant modified corporate GSTIN", time: "18m ago" },
                { detail: "Pixel Creative Labs signed Growth plan", time: "2h ago" },
                { detail: "Nova Tech requested Stripe Sandbox trace", time: "1d ago" }
              ].map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 leading-snug">{log.detail}</p>
                    <span className="text-[8px] text-slate-400 font-bold">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default MemberDashboardTab;
