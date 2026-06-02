import React, { useState } from "react";

const NotificationsTab = ({
  user,
  showToast
}) => {
  // --- Notifications State ---
  const [notifications, setNotifications] = useState([
    {
      id: "notif_1",
      type: "payment_success",
      title: "Invoice #INV-2026-004 Paid Successfully",
      message: "Acme Corp completed payment of ₹45,000 for the Enterprise subscription tier via Stripe credit card.",
      time: "10 mins ago",
      read: false
    },
    {
      id: "notif_2",
      type: "payment_failure",
      title: "Charge Failed for #INV-2026-002",
      message: "Payment collection of $149 from PixelCraft Inc failed due to insufficient funds (Stripe error: card_declined).",
      time: "2 hours ago",
      read: false
    },
    {
      id: "notif_3",
      type: "subscription_renewal",
      title: "Subscription Renewed: Growth Tier",
      message: "Subscription for 'Alpha Apps' automatically renewed for another quarterly cycle. Billing receipt sent.",
      time: "1 day ago",
      read: true
    },
    {
      id: "notif_4",
      type: "team_invite",
      title: "Colleague Invitation Accepted",
      message: "neha@codecraft.com accepted your invitation and joined this workspace as a Workspace Admin.",
      time: "2 days ago",
      read: true
    },
    {
      id: "notif_5",
      type: "system_alert",
      title: "Automated Backup Completed",
      message: "Workspace data directory synchronized with BillNest Cloud vault (SHA-256 integrity verified).",
      time: "3 days ago",
      read: true
    }
  ]);

  const [filterType, setFilterType] = useState("all");

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast("All notifications marked as read.", "success");
  };

  const clearAll = () => {
    setNotifications([]);
    showToast("Notification center cleared.", "info");
  };

  const toggleReadStatus = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const filteredNotifs = filterType === "all"
    ? notifications
    : notifications.filter(n => n.type === filterType);

  // Icon mapping helper
  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment_success":
        return { icon: "check_circle", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      case "payment_failure":
        return { icon: "error", color: "text-rose-600 bg-rose-50 border-rose-100" };
      case "subscription_renewal":
        return { icon: "autorenew", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
      case "team_invite":
        return { icon: "badge", color: "text-amber-600 bg-amber-50 border-amber-100" };
      case "system_alert":
      default:
        return { icon: "info", color: "text-slate-600 bg-slate-50 border-slate-200" };
    }
  };

  const readableTypeName = (type) => {
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">System Notification Center</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Track multi-tenant transactional events, failed client payments, subscription lifecycles, and tenant-wide security logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllRead}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold select-none border-b border-slate-100 pb-3">
        {[
          { id: "all", label: "All Alerts", icon: "notifications" },
          { id: "payment_success", label: "Payment Success", icon: "check_circle" },
          { id: "payment_failure", label: "Payment Failure", icon: "error" },
          { id: "subscription_renewal", label: "Subscription Renewal", icon: "autorenew" },
          { id: "team_invite", label: "Team Invitations", icon: "badge" },
          { id: "system_alert", label: "System Alerts", icon: "info" }
        ].map(pill => {
          const isActive = filterType === pill.id;
          const count = pill.id === "all"
            ? notifications.length
            : notifications.filter(n => n.type === pill.id).length;

          return (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200/80"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{pill.icon}</span>
              <span>{pill.label}</span>
              <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none ${
                isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications List Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
          {filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-[48px] text-slate-300">notifications_off</span>
              <h5 className="font-heading font-bold text-sm text-slate-800 mt-3">All Clear!</h5>
              <p className="text-[10px] text-slate-400 leading-normal max-w-xs mt-1">
                There are no notifications matching this active filter right now. We will notify you of vital tenant activity!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredNotifs.map(n => {
                const badge = getNotificationIcon(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => toggleReadStatus(n.id)}
                    className={`p-5 flex items-start gap-4 transition-all cursor-pointer hover:bg-slate-50/50 relative ${
                      !n.read ? "bg-indigo-50/10 pl-5 border-l-[3px] border-l-indigo-600" : ""
                    }`}
                  >
                    {/* Icon wrapper */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{badge.icon}</span>
                    </div>

                    {/* Content text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {readableTypeName(n.type)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">{n.time}</span>
                      </div>
                      
                      <h4 className={`text-xs mt-0.5 ${!n.read ? "font-bold text-slate-900" : "font-semibold text-slate-600"}`}>
                        {n.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                        {n.message}
                      </p>
                    </div>

                    {/* Checkmark bubble */}
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 self-center flex-shrink-0 animate-pulse"></span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side help / stats cards */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Diagnostic Stats */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div>
              <span className="block text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Notification Health</span>
              <h5 className="font-heading text-xs font-bold text-slate-900">Workspace Diagnostic Feed</h5>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">Total Feed Logs</span>
                  <span className="text-slate-900 font-black text-xs">{notifications.length} logs</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">rule</span>
              </div>

              <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase">Unread Priority Alerts</span>
                  <span className="text-slate-900 font-black text-xs">
                    {notifications.filter(n => !n.read).length} critical
                  </span>
                </div>
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">notifications_active</span>
              </div>
            </div>
          </div>

          {/* Quick Integration Info */}
          <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
              <span className="material-symbols-outlined text-[100px] pointer-events-none">mail_lock</span>
            </div>
            <h5 className="font-heading font-extrabold text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">notifications_paused</span>
              System Digest Presets
            </h5>
            <p className="text-[10px] text-indigo-100 leading-relaxed font-semibold">
              Weekly summary digests are automatically configured for owner mail accounts. You can customize daily dispatch settings inside the personal Profile security dashboard.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default NotificationsTab;
