import React, { useEffect, useState } from "react";
import { api, currency, date } from "../services/api";
import { EmptyState, PageHeader, StatusBadge } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Subscriptions = () => {
  const { showToast } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ clientId: "", planId: "" });

  const load = async () => {
    const [subRes, clientRes, planRes] = await Promise.all([api.get("/subscriptions"), api.get("/clients"), api.get("/plans")]);
    setSubscriptions(subRes.data.subscriptions || []);
    setClients(clientRes.data.clients || []);
    setPlans(planRes.data.plans || []);
  };

  useEffect(() => { load().catch(() => showToast("Could not load subscriptions", "error")); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/subscriptions", { clientId: form.clientId || clients[0]?._id, planId: form.planId || plans[0]?._id });
      await load();
      showToast("Subscription created", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Subscription create failed", "error");
    }
  };

  const action = async (id, name) => {
    await api.post(`/subscriptions/${id}/${name}`);
    await load();
    showToast(`Subscription ${name}d`, "success");
  };

  return (
    <>
      <PageHeader title="Subscriptions" description="Recurring client billing with pause, resume, and cancellation controls." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {subscriptions.length === 0 ? <EmptyState title="No subscriptions" description="Connect a client to a plan to start recurring billing." /> : subscriptions.map((sub) => (
            <article key={sub._id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3"><h2 className="font-black">{sub.planName}</h2><StatusBadge status={sub.status} /></div>
                <p className="text-sm text-slate-500">{sub.client?.name || "Client"} - {currency(sub.amount, sub.currency)} / {sub.billingCycle} - next {date(sub.nextInvoiceDate || sub.nextBillingDate)}</p>
              </div>
              <div className="flex gap-2">
                {sub.status === "paused" ? <button onClick={() => action(sub._id, "resume")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Resume</button> : <button onClick={() => action(sub._id, "pause")} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">Pause</button>}
                <button onClick={() => action(sub._id, "cancel")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Cancel</button>
              </div>
            </article>
          ))}
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-black">New Subscription</h2>
          <label className="mb-3 block text-sm font-bold">Client<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((client) => <option key={client._id} value={client._id}>{client.company || client.name}</option>)}</select></label>
          <label className="mb-4 block text-sm font-bold">Plan<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>{plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name}</option>)}</select></label>
          <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Subscribe Client</button>
        </form>
      </div>
    </>
  );
};

export default Subscriptions;
