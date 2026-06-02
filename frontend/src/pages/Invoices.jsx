import React, { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { api, currency, date } from "../services/api";
import { EmptyState, PageHeader, StatusBadge } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Invoices = () => {
  const { showToast } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ client: "", dueDate: "", description: "Subscription services", quantity: 1, unitPrice: 1000, taxRate: 18 });

  const load = async () => {
    const [invoiceRes, clientRes] = await Promise.all([api.get("/invoices"), api.get("/clients")]);
    setInvoices(invoiceRes.data.invoices || []);
    setClients(clientRes.data.clients || []);
  };

  useEffect(() => {
    load().catch(() => showToast("Could not load invoices", "error"));
  }, []);

  const total = useMemo(() => Number(form.quantity) * Number(form.unitPrice) * (1 + Number(form.taxRate) / 100), [form]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/invoices", {
        client: form.client || clients[0]?._id,
        dueDate: form.dueDate,
        taxRate: Number(form.taxRate),
        items: [{ name: form.description, quantity: Number(form.quantity), price: Number(form.unitPrice) }],
      });
      await load();
      showToast("Draft invoice created", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Invoice create failed", "error");
    }
  };

  const markPaid = async (id) => {
    await api.post(`/invoices/${id}/mark-paid`);
    await load();
    showToast("Invoice marked paid", "success");
  };

  return (
    <>
      <PageHeader title="Invoices" description="Create drafts, enforce state transitions, and export invoice documents." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {invoices.length === 0 ? <EmptyState title="No invoices yet" description="Draft invoices will appear here." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <tr><th className="p-4">Invoice</th><th className="p-4">Client</th><th className="p-4">Amount</th><th className="p-4">Due</th><th className="p-4">Status</th><th className="p-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td className="p-4 font-bold">{invoice.invoiceNumber}</td>
                      <td className="p-4 text-slate-500">{invoice.client?.name || invoice.client?.company || "Client"}</td>
                      <td className="p-4">{currency(invoice.totalAmount || invoice.total || 0, invoice.currency)}</td>
                      <td className="p-4">{date(invoice.dueDate)}</td>
                      <td className="p-4"><StatusBadge status={invoice.status} /></td>
                      <td className="p-4">{invoice.status === "sent" && <button onClick={() => markPaid(invoice._id)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Mark Paid</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-black">Invoice Builder</h2>
          <label className="mb-3 block text-sm font-bold">Client
            <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}>
              {clients.map((client) => <option key={client._id} value={client._id}>{client.company || client.name}</option>)}
            </select>
          </label>
          {["dueDate", "description", "quantity", "unitPrice", "taxRate"].map((field) => (
            <label key={field} className="mb-3 block text-sm font-bold capitalize">{field}
              <input type={field === "dueDate" ? "date" : field === "description" ? "text" : "number"} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
            </label>
          ))}
          <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm font-bold dark:bg-slate-800">Preview total: {currency(total)}</div>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white"><Send size={16} /> Save Draft</button>
        </form>
      </div>
    </>
  );
};

export default Invoices;
