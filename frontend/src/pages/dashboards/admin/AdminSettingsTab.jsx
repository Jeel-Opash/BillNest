import React, { useState } from "react";

const AdminSettingsTab = ({
  user,
  showToast
}) => {

  const [prefix, setPrefix] = useState("INV");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("UTC");
  

  const [apiKeys, setApiKeys] = useState([
    { id: "key_1", name: "Stripe Production Hook", value: "bn_live_************************3a8d", created: "2026-06-01", active: true },
    { id: "key_2", name: "QuickBooks Sync", value: "bn_live_************************8f9c", created: "2026-05-15", active: false }
  ]);

  const [newKeyLabel, setNewKeyLabel] = useState("");

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyLabel.trim()) return;

    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyLabel,
      value: `bn_live_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      created: new Date().toISOString().split("T")[0],
      active: true
    };

    setApiKeys([newKey, ...apiKeys]);
    setNewKeyLabel("");
    showToast(`API Key "${newKeyLabel}" generated. Plaintext shown once.`, "success");
  };

  const handleToggleKey = (id, name, current) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, active: !k.active } : k));
    showToast(`API Key "${name}" status toggled.`, "info");
  };

  const handleSaveParams = (e) => {
    e.preventDefault();
    showToast("Workspace configuration variables saved.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Workspace Configurations */}
      <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Workspace General Params
        </h4>

        <form onSubmit={handleSaveParams} className="space-y-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Name</label>
            <input
              type="text"
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none cursor-not-allowed"
              value={user?.organization?.name || "CodeCraft Agency"}
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Prefix Pattern</label>
            <input
              type="text"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none text-slate-700"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Default currency</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none cursor-pointer text-slate-700"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">System Timezone</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none cursor-pointer text-slate-700"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="UTC">UTC Greenwich</option>
                <option value="IST">Asia/Kolkata (IST)</option>
                <option value="EST">US Eastern (EST)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            Save configurations
          </button>
        </form>
      </div>

      {/* Right side: Developer Integrations & API Keys */}
      <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div>
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
            Developer API Keys
          </h4>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            Generate and manage access tokens for third party script integrations.
          </span>
        </div>

        {/* Generate card */}
        <form onSubmit={handleGenerateKey} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Key Description Label</label>
            <input
              type="text"
              required
              placeholder="e.g. Server Webhook Link"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none text-slate-700"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase"
          >
            Generate Key
          </button>
        </form>

        {/* Keys trace list */}
        <div className="space-y-3.5 pt-4 border-t border-slate-50">
          {apiKeys.map(key => (
            <div key={key.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <h5 className="font-heading font-black text-slate-900 text-xs">{key.name}</h5>
                <p className="text-[9px] text-slate-400 font-bold font-mono mt-1">{key.value}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">Created: {key.created}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                  key.active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}>{key.active ? "Active" : "Inactive"}</span>
                <button
                  type="button"
                  onClick={() => handleToggleKey(key.id, key.name, key.active)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-indigo-600 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                  title={key.active ? "Revoke Key" : "Activate Key"}
                >
                  <span className="material-symbols-outlined text-[16px]">{key.active ? "block" : "verified"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminSettingsTab;
