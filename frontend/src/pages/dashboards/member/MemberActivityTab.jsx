import React, { useState } from "react";

const MemberActivityTab = () => {
  // Activity timeline records
  const [activities] = useState([
    { id: "act_1", type: "invoice", detail: "Invoice INV-001 Created", desc: "Consulting base services drafted for Nike", time: "10 mins ago", status: "success" },
    { id: "act_2", type: "client", detail: "Client Nike Updated", desc: "Modified billing address and POC phone metrics", time: "1 hour ago", status: "success" },
    { id: "act_3", type: "subscription", detail: "Subscription Renewed", desc: "Growth plan active schedule dispatch completed", time: "1 day ago", status: "success" },
    { id: "act_4", type: "payment", detail: "Payment Received", desc: "Stripe gateway confirmed ₹9,900 from Pixel Studio", time: "2 days ago", status: "success" },
    { id: "act_5", type: "work", detail: "Assigned Work Received", desc: "Priya assigned audit check for ABC Restaurant", time: "3 days ago", status: "info" }
  ]);

  const [activeSegment, setActiveSegment] = useState("all");

  const getIcon = (type) => {
    switch (type) {
      case "invoice":
        return { symbol: "receipt_long", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      case "client":
        return { symbol: "person", color: "text-blue-600 bg-blue-50 border-blue-100" };
      case "subscription":
        return { symbol: "autorenew", color: "text-amber-600 bg-amber-50 border-amber-100" };
      case "payment":
        return { symbol: "check_circle", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      default:
        return { symbol: "assignment", color: "text-slate-600 bg-slate-50 border-slate-100" };
    }
  };

  const filteredActivities = activities.filter(act => {
    if (activeSegment === "all") return true;
    return act.type === activeSegment;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Timeline list */}
      <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-50 pb-3 items-center">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Workspace Activity Center</h4>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Audit and operations activity traces</span>
          </div>

          {/* Filtering buttons */}
          <div className="flex gap-1.5 text-[10px] font-black uppercase select-none">
            {[
              { id: "all", label: "All Traces" },
              { id: "invoice", label: "Invoices" },
              { id: "client", label: "Clients" },
              { id: "subscription", label: "Subs" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSegment(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeSegment === tab.id
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline dispatches */}
        <div className="space-y-4 relative pl-4 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {filteredActivities.map(act => {
            const icon = getIcon(act.type);
            return (
              <div key={act.id} className="relative flex gap-4 items-start hover:bg-slate-50/30 p-2 rounded-2xl transition-colors">
                {/* Dot */}
                <span className="absolute left-[3px] top-3 w-1.5 h-1.5 rounded-full bg-slate-300 ring-4 ring-white z-10"></span>
                
                {/* Visual Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 z-20 ${icon.color}`}>
                  <span className="material-symbols-outlined text-[16px]">{icon.symbol}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className="font-heading text-xs font-black text-slate-900 leading-snug">{act.detail}</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{act.desc}</p>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right side: Tasks stats */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Assigned Tasks Summary
        </h4>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-500 space-y-2 font-semibold">
          <div className="flex justify-between">
            <span>Completed Traces</span>
            <span className="font-black text-slate-800">4 tasks completed</span>
          </div>
          <div className="flex justify-between">
            <span>Awaiting Verification</span>
            <span className="font-black text-slate-800">1 task pending</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MemberActivityTab;
