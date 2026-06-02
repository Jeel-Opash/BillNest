import React, { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { api } from "../services/api";
import { PageHeader } from "../components/DataState";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { showToast } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [plainKey, setPlainKey] = useState("");

  const load = async () => {
    const [orgRes, teamRes, keyRes] = await Promise.all([api.get("/settings/organization"), api.get("/settings/team"), api.get("/settings/api-keys")]);
    setOrganization(orgRes.data.organization);
    setMembers(teamRes.data.members || []);
    setApiKeys(keyRes.data.apiKeys || []);
  };

  useEffect(() => { load().catch(() => showToast("Could not load settings", "error")); }, []);

  const createKey = async () => {
    const res = await api.post("/settings/api-keys", { name: "Dashboard API key" });
    setPlainKey(res.data.plainKey);
    await load();
    showToast("API key generated", "success");
  };

  const revoke = async (id) => {
    await api.delete(`/settings/api-keys/${id}`);
    await load();
    showToast("API key revoked", "success");
  };

  return (
    <>
      <PageHeader title="Settings" description="Organization profile, team access, and tenant API keys." />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-black">Organization</h2>
          <p className="font-bold">{organization?.name}</p>
          <p className="text-sm text-slate-500">{organization?.slug}</p>
          <p className="mt-3 text-sm">Plan: <strong>{organization?.plan}</strong></p>
          <p className="text-sm">Currency: <strong>{organization?.currency}</strong></p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-black">Team</h2>
          <div className="space-y-3">{members.map((member) => <div key={member._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="font-bold">{member.name}</p><p className="text-slate-500">{member.email} - {member.role}</p></div>)}</div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">API Keys</h2><button onClick={createKey} className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white"><KeyRound size={16} /></button></div>
          {plainKey && <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">Copy now: {plainKey}</div>}
          <div className="space-y-3">{apiKeys.map((key) => <div key={key._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><span>{key.name} ...{key.last4 || "hash"}</span>{key.isActive && <button onClick={() => revoke(key._id)} className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white">Revoke</button>}</div>)}</div>
        </section>
      </div>
    </>
  );
};

export default Settings;
