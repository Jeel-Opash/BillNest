import React from "react";

const OverviewTab = ({ paidValue, mrrValue, outstandingValue, user }) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-heading text-2xl font-bold text-slate-900">Analytics Overview</h3>
        <p className="text-slate-500 text-sm mt-1">Real-time performance metrics and revenue distributions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Collected Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">₹{paidValue.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +12.5% vs last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Monthly Recurring Revenue</p>
            <h3 className="text-2xl font-bold text-indigo-600 mb-4 tracking-tight">₹{mrrValue.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">autorenew</span>
            3 Active Subscriptions
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Outstanding Payments</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">₹{outstandingValue.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">hourglass_empty</span>
            Requires Dunning Action
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Avg. Revenue Per User</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">₹{Math.round(mrrValue / 3).toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 text-[10px] font-bold px-2 py-1 rounded-lg w-fit">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Stable from last month
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-heading text-lg font-bold text-slate-900">Revenue Trends</h4>
              <p className="text-slate-400 text-xs mt-0.5">Past 12 months growth trajectory</p>
            </div>
            <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200/50">
              <button className="bg-white text-indigo-600 shadow-sm text-xs font-semibold px-3 py-1 rounded-md">Monthly</button>
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
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <path className="text-indigo-600" d="M 20 80 C 80 82, 120 62, 170 70 C 220 78, 280 45, 330 48 C 380 50, 420 22, 480 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 20 80 C 80 82, 120 62, 170 70 C 220 78, 280 45, 330 48 C 380 50, 420 22, 480 18 L 480 100 L 20 100 Z" fill="url(#chartGradient)" />
              <circle cx="20" cy="80" r="4" className="fill-white stroke-indigo-600 stroke-[2px]" />
              <circle cx="170" cy="70" r="4" className="fill-white stroke-indigo-600 stroke-[2px]" />
              <circle cx="330" cy="48" r="4" className="fill-white stroke-indigo-600 stroke-[2px]" />
              <circle cx="480" cy="18" r="5" className="fill-indigo-600 stroke-white stroke-[2px]" />
            </svg>

            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-2">
              <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span><span>Dec (Live)</span>
            </div>
          </div>
        </div>

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
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Growth (Tier 2)</span>
                  <span className="text-slate-900 font-bold">30%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: "30%" }}></div>
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

          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <span className="material-symbols-outlined text-[16px]">lightbulb</span>
              OPTIMIZATION TIP
            </div>
            <p className="text-indigo-900/80 text-xs leading-relaxed font-semibold">
              Tier 3 conversion is up 5% this quarter. High-value client focus is yielding significantly better profit margins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
