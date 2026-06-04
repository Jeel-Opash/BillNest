import React, { useState, useEffect } from "react";

const IntegrationsTab = ({
  user,
  showToast
}) => {

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


  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem(`workspace_${user?.email || "guest"}_webhook_url`) || "https://hooks.zapier.com/hooks/catch/12345/abc";
  });

  useEffect(() => {
    localStorage.setItem(`workspace_${user?.email || "guest"}_webhook_url`, webhookUrl);
  }, [webhookUrl, user]);

  const [isStripeLive, setIsStripeLive] = useState(false);
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(true);


  const [usageLogs] = useState([
    { id: "log_1", method: "GET", endpoint: "/api/v1/clients", status: 200, ip: "192.168.1.45", time: "10 mins ago" },
    { id: "log_2", method: "POST", endpoint: "/api/v1/invoices", status: 201, ip: "13.233.45.19", time: "1 hour ago" },
    { id: "log_3", method: "GET", endpoint: "/api/v1/subscriptions", status: 200, ip: "192.168.1.45", time: "2 hours ago" },
    { id: "log_4", method: "POST", endpoint: "/api/v1/invoices/void", status: 400, ip: "54.120.9.110", time: "1 day ago" }
  ]);


  const [selectedWebhookEvent, setSelectedWebhookEvent] = useState("payment_intent.succeeded");
  const [simulatedPayload, setSimulatedPayload] = useState("");
  const [dispatchLogs, setDispatchLogs] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    let payloadObj = {};
    const mockId = Math.random().toString(36).substring(2, 10);
    
    if (selectedWebhookEvent === "payment_intent.succeeded") {
      payloadObj = {
        id: `evt_test_${mockId}`,
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: `pi_${mockId}`,
            object: "payment_intent",
            amount: 1500000,
            currency: "inr",
            status: "succeeded",
            payment_method: `pm_test_${mockId}`,
            receipt_email: "finance@pixelstudio.com",
            metadata: {
              invoice_id: "INV-2026-004",
              tenant_id: user?.tenantId || "org_mock"
            }
          }
        }
      };
    } else if (selectedWebhookEvent === "payment_intent.payment_failed") {
      payloadObj = {
        id: `evt_test_${mockId}`,
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: `pi_${mockId}`,
            object: "payment_intent",
            amount: 500000,
            currency: "inr",
            status: "requires_payment_method",
            last_payment_error: {
              code: "card_declined",
              decline_code: "insufficient_funds",
              message: "The card has insufficient funds to complete this transaction."
            },
            metadata: {
              invoice_id: "INV-2026-002",
              tenant_id: user?.tenantId || "org_mock"
            }
          }
        }
      };
    } else if (selectedWebhookEvent === "invoice.sent") {
      payloadObj = {
        id: `evt_test_${mockId}`,
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        type: "invoice.sent",
        data: {
          object: {
            id: `inv_test_${mockId}`,
            object: "invoice",
            amount_due: 1250000,
            customer_email: "client@workspacemail.com",
            customer_name: "Pixel Creative Labs",
            number: "INV-2026-009",
            status: "open",
            due_date: "2026-06-30"
          }
        }
      };
    } else if (selectedWebhookEvent === "invoice.voided") {
      payloadObj = {
        id: `evt_test_${mockId}`,
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        type: "invoice.voided",
        data: {
          object: {
            id: `inv_test_${mockId}`,
            object: "invoice",
            amount_due: 0,
            number: "INV-2026-001",
            status: "void"
          }
        }
      };
    }
    setSimulatedPayload(JSON.stringify(payloadObj, null, 2));
  }, [selectedWebhookEvent, user]);

  const handleTriggerWebhookDispatch = async () => {
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      showToast("Please specify a valid destination HTTP/HTTPS endpoint URL.", "error");
      return;
    }
    
    setIsDispatching(true);
    const dispatchTime = new Date().toLocaleTimeString();
    
    try {
      const parsed = JSON.parse(simulatedPayload);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BillNest-Signature": `t=${Math.floor(Date.now() / 1000)},v1=${Math.random().toString(36).substring(2, 32)}`
        },
        body: JSON.stringify(parsed)
      });
      
      const responseText = await response.text().catch(() => "");
      const newLog = {
        id: `log_${Date.now()}`,
        time: dispatchTime,
        event: selectedWebhookEvent,
        url: webhookUrl,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 150) || "(No response body)"
      };
      
      setDispatchLogs(prev => [newLog, ...prev]);
      if (response.ok) {
        showToast("Webhook test dispatch successfully delivered!", "success");
      } else {
        showToast(`Webhook endpoint responded with status ${response.status}`, "warning");
      }
    } catch (err) {
      console.error(err);
      const newLog = {
        id: `log_${Date.now()}`,
        time: dispatchTime,
        event: selectedWebhookEvent,
        url: webhookUrl,
        status: "NET_ERR",
        statusText: "Connection Refused / Timeout",
        responseText: err.message || "Failed to connect to destination address."
      };
      setDispatchLogs(prev => [newLog, ...prev]);
      showToast("Webhook delivery failed: Network target unreachable.", "error");
    } finally {
      setIsDispatching(false);
    }
  };

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

      {/* Webhook Event Simulator & Dispatch Sandbox */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-2xl mt-6 space-y-6">
        <div>
          <h4 className="font-heading text-base font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] animate-pulse text-indigo-400">developer_board</span>
            Webhook Event Simulator & Dispatch Sandbox
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
            Dispatch mock crypto-signed Stripe event payloads directly to your destination endpoint. Great for debugging local tunnels (e.g. ngrok) or Zapier configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: configurations */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Simulate Event Type</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                value={selectedWebhookEvent}
                onChange={(e) => setSelectedWebhookEvent(e.target.value)}
              >
                <option value="payment_intent.succeeded">payment_intent.succeeded</option>
                <option value="payment_intent.payment_failed">payment_intent.payment_failed</option>
                <option value="invoice.sent">invoice.sent</option>
                <option value="invoice.voided">invoice.voided</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Destination URL</label>
              <div className="flex bg-slate-850 rounded-xl border border-slate-700 overflow-hidden p-1.5">
                <input
                  type="text"
                  placeholder="https://your-server.com/stripe-webhook"
                  className="flex-1 bg-transparent text-xs font-mono font-semibold px-2 py-1 outline-none text-slate-200"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerWebhookDispatch}
                disabled={isDispatching}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-700/30 flex items-center justify-center gap-2 cursor-pointer outline-none"
              >
                {isDispatching ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Dispatching Payload...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Trigger Webhook Test</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulated request headers insight */}
            <div className="bg-slate-850 p-4 border border-slate-800 rounded-2xl space-y-2 text-[10px] text-slate-400 font-semibold leading-relaxed">
              <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">HEADERS INJECTED</span>
              <div className="space-y-1 font-mono">
                <div>Content-Type: <span className="text-emerald-400">application/json</span></div>
                <div>User-Agent: <span className="text-slate-300">BillNest-Webhook-Simulator/v1.0</span></div>
                <div>X-BillNest-Signature: <span className="text-amber-500">t=171739...,v1=sig_hash...</span></div>
              </div>
            </div>
          </div>

          {/* Right panel: payload JSON editor & response feed */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex-1 bg-slate-950 p-4 border border-slate-800 rounded-2xl font-mono text-[11px] overflow-hidden flex flex-col min-h-[220px]">
              <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider mb-2">Simulated JSON Body</span>
              <textarea
                className="flex-1 bg-transparent text-emerald-400 outline-none resize-none font-semibold leading-relaxed w-full min-h-[160px]"
                value={simulatedPayload}
                onChange={(e) => setSimulatedPayload(e.target.value)}
              />
            </div>

            {/* Sandbox dispatch logs terminal */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl max-h-[160px] overflow-y-auto font-mono text-[10px] space-y-2 text-slate-400">
              <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider">Sandbox Dispatch Logs</span>
              
              {dispatchLogs.length > 0 ? (
                dispatchLogs.map((log) => {
                  const isErr = log.status === "NET_ERR" || log.status >= 400;
                  return (
                    <div key={log.id} className="border-b border-slate-900 pb-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{log.time} - {log.event}</span>
                        <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                          isErr ? "bg-rose-950 text-rose-400 border border-rose-900/50" : "bg-emerald-950 text-emerald-400 border border-emerald-900/50"
                        }`}>{log.status} {log.statusText}</span>
                      </div>
                      <div className="text-[9px] truncate text-slate-500">Destination: {log.url}</div>
                      <div className="text-[9px] text-slate-400 bg-slate-900 p-1.5 rounded truncate">Response: {log.responseText}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-600 italic">
                  No active logs in this session. Trigger a test dispatch to monitor response feedback.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IntegrationsTab;
