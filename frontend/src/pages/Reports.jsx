import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, currency } from "../services/api";
import { PageHeader } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const { showToast } = useAuth();
  const [report, setReport] = useState({ invoices: [], totals: {} });
  const [status, setStatus] = useState("");

  const load = async () => {
    const res = await api.get("/reports/invoices", { params: { status: status || undefined } });
    setReport({ invoices: res.data.invoices || [], totals: res.data.totals || {} });
  };

  useEffect(() => { load().catch(() => showToast("Could not load report", "error")); }, [status]);

  const exportCsv = () => {
    window.location.href = `${api.defaults.baseURL}/reports/invoices?format=csv${status ? `&status=${status}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Reports" description="Invoice, revenue, and subscription exports scoped to your tenant." action={<button onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white"><Download size={16} /> Export CSV</button>} />
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        {[
          ["Invoices", report.totals.count || 0],
          ["Total", currency(report.totals.totalAmount || 0)],
          ["Paid", currency(report.totals.paidAmount || 0)],
          ["Outstanding", currency(report.totals.outstandingAmount || 0)],
        ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
      </div>
      <div className="mb-4 flex gap-2">
        {["", "draft", "sent", "paid", "overdue", "void"].map((item) => <button key={item || "all"} onClick={() => setStatus(item)} className={`rounded-lg px-3 py-2 text-sm font-bold ${status === item ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900"}`}>{item || "all"}</button>)}
      </div>
      <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="p-4">Invoice</th><th className="p-4">Client</th><th className="p-4">Status</th><th className="p-4">Total</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{report.invoices.map((invoice) => <tr key={invoice._id}><td className="p-4 font-bold">{invoice.invoiceNumber}</td><td className="p-4">{invoice.client?.name || "Client"}</td><td className="p-4">{invoice.status}</td><td className="p-4">{currency(invoice.totalAmount || invoice.total || 0, invoice.currency)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default Reports;
