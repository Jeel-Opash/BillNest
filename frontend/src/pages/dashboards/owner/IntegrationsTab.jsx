import React, { useState, useEffect } from "react";

const IntegrationsTab = ({
  user,
  showToast
}) => {
  // --- API Keys State ---
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_api_keys`);
      return saved ? JSON.parse(saved) : [
        { id: "k1", label: "Production Scoped Token", key: "bn_live_codecraft_99f2e811bc", createdAt: "2026-05-28" }
      ];
    } catch {
      return [{ id: "k1", label: "Production Scoped Token", key: "bn_live_codecraft_99f2e811bc", createdAt: "2026-05-28" }];
    }
  });

  useEffect(() => {
    localStorage.setItem(`workspace_${user?.email || "guest"}_api_keys`, JSON.stringify(apiKeys));
  }, [apiKeys, user]);

  const [newKeyLabel, setNewKeyLabel] = useState("");

  // --- Webhook URL State ---
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem(`workspace_${user?.email || "guest"}_webhook_url`) || "https://hooks.zapier.com/hooks/catch/12345/abc";
  });

  useEffect(() => {
    localStorage.setItem(`workspace_${user?.email || "guest"}_webhook_url`, webhookUrl);
  }, [webhookUrl, user]);

  const [isStripeLive, setIsStripeLive] = useState(false);
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(true);

  // --- API Usage Logs State ---
  const [usageLogs] = useState([
    { id: "log_1", method: "GET", endpoint: "/api/v1/clients", status: 200, ip: "192.168.1.45", time: "10 mins ago" },
    { id: "log_2", method: "POST", endpoint: "/api/v1/invoices", status: 201, ip: "13.233.45.19", time: "1 hour ago" },
    { id: "log_3", method: "GET", endpoint: "/api/v1/subscriptions", status: 200, ip: "192.168.1.45", time: "2 hours ago" },
    { id: "log_4", method: "POST", endpoint: "/api/v1/invoices/void", status: 400, ip: "54.120.9.110", time: "1 day ago" }
  ]);

  // --- Handlers ---
  const handleCreateApiKeySubmit = (e) => {
    e.preventDefault();
    if (!newKeyLabel) return;

    const randomSuffix = Math.random().toString(36).substring(2, 12);
    const newKeyObj = {
      id: `k_${Date.now()}`,
      label: newKeyLabel,
      key: `bn_live_${user?.organization?.name?.toLowerCase().replace(/\s+/g, "") || "client"}_${randomSuffix}`,
      createdAt: new Date().toISOString().split("T")[0]
    };

    setApiKeys([...apiKeys, newKeyObj]);
    setNewKeyLabel("");
    showToast(`API Key "${newKeyLabel}" generated successfully!`, "success");
  };

  const handleRevokeApiKey = (id, label) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    showToast(`API Key "${label}" has been revoked successfully.`, "info");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("API Key copied to clipboard!", "info");
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">API Scopes & Third-Party Integrations</h3>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Deploy live developer access tokens, activate real-time webhooks, and interface with QuickBooks or Hubspot connectors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: API Keys Generation & Usage Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* API Key Management */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">vpn_key</span>
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Developer Access Keys</h4>
              </div>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full font-bold">API ACCESS ACTIVE</span>
            </div>

            {/* Key deployer form */}
            <form onSubmit={handleCreateApiKeySubmit} className="flex gap-2.5">
              <input
                type="text"
                required
                placeholder="Key designation label (e.g., mobile-app-service)"
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer whitespace-nowrap outline-none"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Deploy Key
              </button>
            </form>

            {/* Active Keys Registry */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">Active Keys Registry</span>

              {apiKeys.map(k => (
                <div key={k.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[18px]">shield</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{k.label}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{k.key}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(k.key)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px] cursor-pointer">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                    <div className="hidden sm:block text-right">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase">DEPLOYED</span>
                      <span>{k.createdAt}</span>
                    </div>
                    {k.id !== "k1" ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeApiKey(k.id, k.label)}
                        className="text-rose-600 hover:text-rose-800 uppercase tracking-widest font-black text-[9px] border border-rose-200 bg-rose-50/50 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400 font-bold uppercase italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200/40">Primary</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Usage Logs Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">terminal</span>
              <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">API Usage Logs</h4>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-2.5 pl-3">API Method</th>
                    <th className="p-2.5">Endpoint URI</th>
                    <th className="p-2.5">Source IP</th>
                    <th className="p-2.5">Response Code</th>
                    <th className="p-2.5 pr-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {usageLogs.map(log => {
                    const isSuccess = log.status >= 200 && log.status < 300;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-2.5 pl-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.method === "POST" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                          }`}>{log.method}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-900">{log.endpoint}</td>
                        <td className="p-2.5 font-mono text-slate-500">{log.ip}</td>
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            isSuccess ? "text-emerald-700" : "text-rose-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                            {log.status} {isSuccess ? "OK" : "Bad Request"}
                          </span>
                        </td>
                        <td className="p-2.5 pr-3 text-right text-slate-400 font-semibold">{log.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Third-Party Connectors */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Connector 1: Stripe */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">account_balance_wallet</span>
                <span className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Stripe Gateway</span>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                isStripeLive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}>
                {isStripeLive ? "Live Mode" : "Sandbox"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
              Interface Stripe checkout overrides inside your client payment portal.
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Enable Simulated Mode</span>
              <button
                type="button"
                onClick={() => {
                  setIsStripeLive(!isStripeLive);
                  showToast(isStripeLive ? "Switched Stripe gateway to simulated Sandbox mode." : "Live Stripe webhooks armed.", "info");
                }}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-all outline-none cursor-pointer flex items-center ${
                  isStripeLive ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>
          </div>

          {/* Connector 2: Webhooks */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">webhook</span>
                <span className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Webhooks endpoint</span>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                isWebhookEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {isWebhookEnabled ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider">Destination url</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none font-mono"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Disable Endpoint Feed</span>
              <button
                type="button"
                onClick={() => {
                  setIsWebhookEnabled(!isWebhookEnabled);
                  showToast(isWebhookEnabled ? "Webhook destination feed suspended." : "Webhook dispatch armed.", "info");
                }}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-all outline-none cursor-pointer flex items-center ${
                  isWebhookEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>
          </div>

          {/* Connector 3: External APIs (Accounting Connectors) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">hub</span>
                <span className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">QuickBooks Sync</span>
              </div>
              <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                Not Configured
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
              Automatically sync outgoing client invoices and collected receipts to QuickBooks Online.
            </p>

            <button
              type="button"
              onClick={() => showToast("QuickBooks OAuth flow initialized.", "info")}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all block text-center cursor-pointer"
            >
              Configure QuickBooks Connect
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default IntegrationsTab;
