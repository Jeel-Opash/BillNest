import React, { useEffect } from "react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      bg: "bg-emerald-950/95 border-emerald-500/30 text-emerald-200",
      icon: "check_circle",
      iconColor: "text-emerald-400"
    },
    error: {
      bg: "bg-rose-950/95 border-rose-500/30 text-rose-200",
      icon: "error",
      iconColor: "text-rose-400"
    },
    warning: {
      bg: "bg-amber-950/95 border-amber-500/30 text-amber-200",
      icon: "warning",
      iconColor: "text-amber-400"
    },
    info: {
      bg: "bg-indigo-950/95 border-indigo-500/30 text-indigo-200",
      icon: "info",
      iconColor: "text-indigo-400"
    }
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] animate-slide-up select-none">
      <div className={`flex items-center gap-3 border backdrop-blur-md rounded-2xl p-4 shadow-xl max-w-sm ${config.bg}`}>
        <span className={`material-symbols-outlined text-[20px] font-bold shrink-0 ${config.iconColor}`}>
          {config.icon}
        </span>
        <p className="text-xs font-semibold leading-relaxed pr-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
          aria-label="Close Notification"
        >
          <span className="material-symbols-outlined text-[16px] font-black">close</span>
        </button>
      </div>
    </div>
  );
};

export default Toast;
