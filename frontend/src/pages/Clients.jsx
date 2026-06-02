import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../services/api";
import { EmptyState, PageHeader } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Clients = () => {
  const { showToast } = useAuth();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", company: "", currency: "INR" });

  const load = async () => {
    const res = await api.get("/clients");
    setClients(res.data.clients || []);
  };

  useEffect(() => {
    load().catch(() => showToast("Could not load clients", "error"));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/clients", form);
      setForm({ name: "", email: "", company: "", currency: "INR" });
      await load();
      showToast("Client created", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Client create failed", "error");
    }
  };

  return (
    <>
      <PageHeader title="Clients" description="Tenant-scoped customers, billing profiles, and contact details." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {clients.length === 0 ? (
            <EmptyState title="No clients yet" description="Create your first client to start invoicing." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Currency</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clients.map((client) => (
                    <tr key={client._id}>
                      <td className="p-4 font-bold">{client.company || client.name}</td>
                      <td className="p-4 text-slate-500">{client.email}</td>
                      <td className="p-4">{client.currency}</td>
                      <td className="p-4">{client.isActive ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-black">Add Client</h2>
          {["company", "name", "email"].map((field) => (
            <label key={field} className="mb-3 block text-sm font-bold capitalize">
              {field}
              <input className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" required={field !== "company"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
            </label>
          ))}
          <label className="mb-4 block text-sm font-bold">
            Currency
            <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {["INR", "USD", "EUR", "GBP", "AUD"].map((code) => <option key={code}>{code}</option>)}
            </select>
          </label>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white"><Plus size={16} /> Create</button>
        </form>
      </div>
    </>
  );
};

export default Clients;
