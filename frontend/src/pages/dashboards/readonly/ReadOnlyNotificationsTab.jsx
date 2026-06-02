import React, { useState } from "react";

const ReadOnlyNotificationsTab = ({
  notifications,
  setNotifications,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast("Marked all observer alerts as read.", "success");
  };

  const clearAll = () => {
    setNotifications([]);
    showToast("Notifications cleared successfully.", "info");
  };

  const toggleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const deleteSingle = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    showToast("Alert removed.", "info");
  };

  const getIcon = (type) => {
    switch (type) {
      case "invoice_due":
        return { symbol: "schedule", color: "text-amber-600 bg-amber-50 border-amber-100" };
      case "payment_success":
        return { symbol: "check_circle", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      case "payment_failure":
        return { symbol: "error", color: "text-rose-600 bg-rose-50 border-rose-100" };
      case "client_update":
        return { symbol: "person", color: "text-blue-600 bg-blue-50 border-blue-100" };
      case "subscription_renewal":
        return { symbol: "autorenew", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      default:
        return { symbol: "notifications", color: "text-slate-600 bg-slate-50 border-slate-100" };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Alert feed */}
      <div className="lg:col-span-8 space-y-6">

        {/* Categories Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap gap-2 text-xs font-semibold select-none">
          {[
            { id: "all", label: "All Alerts" },
            { id: "unread", label: "Unread" },
            { id: "invoice_due", label: "Invoice Alerts" },
            { id: "payment_success", label: "Payment Alerts" },
            { id: "payment_failure", label: "Failed Logs" },
            { id: "subscription_renewal", label: "Renewals" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inbox alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Observer Alerts</h4>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Notifications feed</span>
            </div>

            <div className="flex gap-2 text-[10px] font-black uppercase select-none">
              <button onClick={markAllRead} className="text-indigo-600 hover:text-indigo-800 cursor-pointer">Mark All Read</button>
              <span className="text-slate-200">•</span>
              <button onClick={clearAll} className="text-rose-600 hover:text-rose-800 cursor-pointer">Clear All</button>
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No active notifications found.
              </div>
            ) : (
              filteredNotifications.map(item => {
                const icon = getIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex justify-between gap-4 items-start ${
                      item.read
                        ? "bg-slate-50/20 border-slate-100/50"
                        : "bg-indigo-50/10 border-indigo-100/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${icon.color}`}>
                        <span className="material-symbols-outlined text-[16px]">{icon.symbol}</span>
                      </div>
                      <div>
                        <h5 className="font-heading text-xs font-black text-slate-800 leading-snug flex items-center gap-1.5">
                          {item.title || "Observer Alert"}
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse inline-block"></span>
                          )}
                        </h5>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">{item.message || item.text}</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1.5">{item.time}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0 select-none">
                      <button
                        onClick={() => toggleRead(item.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-indigo-600 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                        title={item.read ? "Mark Unread" : "Mark Read"}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.read ? "drafts" : "mail"}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteSingle(item.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                        title="Delete Alert"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right side: summary */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 select-none">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Telemetry Summary
        </h4>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-500 space-y-2 font-semibold">
          <div className="flex justify-between">
            <span>Total Logged Alerts</span>
            <span className="font-black text-slate-800">{notifications.length} logs</span>
          </div>
          <div className="flex justify-between">
            <span>Unread Notifications</span>
            <span className="font-black text-slate-800">{notifications.filter(n => !n.read).length} counts</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReadOnlyNotificationsTab;
