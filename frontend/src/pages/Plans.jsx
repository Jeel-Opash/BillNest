import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, currency } from "../services/api";
import { EmptyState, PageHeader } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Plans = () => {
  const { showToast } = useAuth();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", price: 49, currency: "USD", billingCycle: "monthly", features: "Invoices, Payments, Reports" });

  const load = async () => {
    const res = await api.get("/plans");
    setPlans(res.data.plans || []);
  };

  useEffect(() => { load().catch(() => showToast("Could not load plans", "error")); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/plans", { ...form, features: form.features.split(",").map((item) => item.trim()).filter(Boolean) });
      setForm({ ...form, name: "" });
      await load();
      showToast("Plan created", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Plan create failed", "error");
    }
  };

  return (
    <>
      <PageHeader title="Plans" description="Reusable billing plans synced to tenant subscriptions." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.length === 0 ? <div className="md:col-span-2 xl:col-span-3"><EmptyState title="No plans" description="Create monthly or yearly plans for subscriptions." /></div> : plans.map((plan) => (
            <article key={plan._id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-lg font-black">{plan.name}</p>
              <p className="mt-2 text-3xl font-black">{currency(plan.price, plan.currency)} <span className="text-sm text-slate-500">/{plan.billingCycle}</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">{plan.features?.map((feature) => <li key={feature}>- {feature}</li>)}</ul>
            </article>
          ))}
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-black">Create Plan</h2>
          {["name", "price", "currency", "features"].map((field) => (
            <label key={field} className="mb-3 block text-sm font-bold capitalize">{field}
              <input type={field === "price" ? "number" : "text"} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
            </label>
          ))}
          <label className="mb-4 block text-sm font-bold">Billing Cycle
            <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
              <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
            </select>
          </label>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white"><Plus size={16} /> Create</button>
        </form>
      </div>
    </>
  );
};

export default Plans;
