import React from "react";

export const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div>
      <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ title, description }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
    <p className="font-bold text-slate-900 dark:text-white">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);

export const StatusBadge = ({ status }) => {
  const tone = {
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    sent: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    overdue: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    void: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${tone[status] || tone.draft}`}>{status}</span>;
};
