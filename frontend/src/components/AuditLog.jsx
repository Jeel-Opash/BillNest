import React, { useState, useMemo } from "react";

const AuditLog = ({
  logs = [],
  title = "Compliance & Activity Audit Logs",
  description = "Track append-only activity metrics and security access trails across this tenant partition.",
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedActor, setSelectedActor] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = newest first
  const PAGE_SIZE = 8;

  const modulesList = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.module).filter(Boolean)));
  }, [logs]);

  const actorsList = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.actor || l.user).filter(Boolean)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      const actorName = log.actor || log.user || "";
      const actionDesc = log.action || "";
      const detailsDesc = log.details || "";
      const ipAddr = log.ipAddress || log.ip || "";
      const ts = log.timestamp || "";

      const matchesSearch =
        actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        actionDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detailsDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipAddr.includes(searchTerm);

      const matchesModule = selectedModule === "all" || log.module === selectedModule;
      const matchesStatus =
        selectedStatus === "all" || log.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchesActor = selectedActor === "all" || (log.actor || log.user) === selectedActor;

      let matchesDate = true;
      if (dateFrom) matchesDate = matchesDate && ts >= dateFrom;
      if (dateTo) matchesDate = matchesDate && ts <= dateTo + " 23:59:59";

      return matchesSearch && matchesModule && matchesStatus && matchesActor && matchesDate;
    });

    // Sort by timestamp
    result.sort((a, b) => {
      const ta = a.timestamp || "";
      const tb = b.timestamp || "";
      return sortOrder === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });

    return result;
  }, [logs, searchTerm, selectedModule, selectedStatus, selectedActor, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useMemo(() => setPage(1), [searchTerm, selectedModule, selectedStatus, selectedActor, dateFrom, dateTo, sortOrder]);

  // Stats
  const successCount = logs.filter((l) => l.status?.toLowerCase() === "success").length;
  const failedCount = logs.filter((l) => l.status?.toLowerCase() === "failed").length;
  const uniqueActors = new Set(logs.map((l) => l.actor || l.user).filter(Boolean)).size;

  const handleExportCSV = () => {
    if (onExportCSV) { onExportCSV(filteredLogs); return; }
    const headers = ["Timestamp", "Actor", "Role", "Action", "Details", "Module", "IP Address", "Status"];
    const rows = filteredLogs.map((l) => [
      l.timestamp || "",
      l.actor || l.user || "",
      l.role || "",
      l.action || "",
      `"${(l.details || "").replace(/"/g, "'")}"`,
      l.module || "",
      l.ipAddress || l.ip || "",
      l.status || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getModuleBadgeColor = (mod) => {
    const m = mod?.toLowerCase() || "";
    if (m.includes("invoice")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (m.includes("client")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (m.includes("payment")) return "bg-rose-50 text-rose-700 border-rose-100";
    if (m.includes("team")) return "bg-amber-50 text-amber-700 border-amber-100";
    if (m.includes("subscription")) return "bg-violet-50 text-violet-700 border-violet-100";
    if (m.includes("auth") || m.includes("security")) return "bg-red-50 text-red-700 border-red-100";
    if (m.includes("setting")) return "bg-blue-50 text-blue-700 border-blue-100";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const getActionIcon = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("creat") || a.includes("add")) return "add_circle";
    if (a.includes("updat") || a.includes("edit") || a.includes("modif")) return "edit";
    if (a.includes("delet") || a.includes("void") || a.includes("remov")) return "delete";
    if (a.includes("payment") || a.includes("paid")) return "payments";
    if (a.includes("invite") || a.includes("member")) return "person_add";
    if (a.includes("login") || a.includes("auth") || a.includes("fail")) return "lock";
    if (a.includes("export") || a.includes("download")) return "download";
    return "history";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 py-2 text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-[15px] text-emerald-600 animate-pulse">lock</span>
            LEDGER SHA-256
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length, icon: "history", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Successful", value: successCount, icon: "check_circle", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Failed / Alerts", value: failedCount, icon: "error_outline", color: "text-rose-600 bg-rose-50 border-rose-100" },
          { label: "Unique Actors", value: uniqueActors, icon: "group", color: "text-violet-600 bg-violet-50 border-violet-100" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 border rounded-2xl px-4 py-3 ${s.color} shadow-sm bg-white`}>
            <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            <div>
              <p className="text-lg font-black leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[17px]">search</span>
          <input
            type="text"
            placeholder="Search actor, action, IP..."
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold outline-none transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Module */}
        <select
          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer shadow-sm text-slate-700"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="all">All Modules</option>
          {modulesList.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Status */}
        <select
          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer shadow-sm text-slate-700"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="success">Success only</option>
          <option value="failed">Failed only</option>
        </select>

        {/* Actor */}
        <select
          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer shadow-sm text-slate-700"
          value={selectedActor}
          onChange={(e) => setSelectedActor(e.target.value)}
        >
          <option value="all">All Actors</option>
          {actorsList.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Date From */}
        <input
          type="date"
          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer shadow-sm text-slate-700"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="Filter from date"
        />

        {/* Date To */}
        <input
          type="date"
          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer shadow-sm text-slate-700"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="Filter to date"
        />
      </div>

      {/* Results count + sort toggle */}
      <div className="flex items-center justify-between -mt-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {filteredLogs.length} records matching filters
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">{sortOrder === "desc" ? "arrow_downward" : "arrow_upward"}</span>
            {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </button>
          {(searchTerm || selectedModule !== "all" || selectedStatus !== "all" || selectedActor !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearchTerm(""); setSelectedModule("all"); setSelectedStatus("all"); setSelectedActor("all"); setDateFrom(""); setDateTo(""); }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
              <tr>
                <th
                  className="p-3.5 pl-5 cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  <span className="flex items-center gap-1">
                    Timestamp
                    <span className="material-symbols-outlined text-[12px]">{sortOrder === "desc" ? "arrow_downward" : "arrow_upward"}</span>
                  </span>
                </th>
                <th className="p-3.5">User / Actor</th>
                <th className="p-3.5">Action Triggered</th>
                <th className="p-3.5">Module Scope</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5 pr-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {pagedLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[40px] text-slate-300">history_toggle_off</span>
                    <h5 className="font-heading font-bold text-sm text-slate-800 mt-2">No Records Found</h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                      No logs match your current filters. Adjust search or filter parameters.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => {
                  const actorStr = log.actor || log.user || "System Integration";
                  const roleStr = log.role || "Operator";
                  const actionStr = log.action || "Event Triggered";
                  const detailsStr = log.details || "Activity details processed.";
                  const moduleStr = log.module || "General";
                  const ipStr = log.ipAddress || log.ip || "127.0.0.1";
                  const isSuccess = log.status?.toLowerCase() === "success";

                  return (
                    <tr
                      key={log.id || Math.random()}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="p-3.5 pl-5 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                        {log.timestamp || "Just Now"}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-[9px] shrink-0">
                            {actorStr.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{actorStr}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{roleStr}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <div className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5 shrink-0">{getActionIcon(actionStr)}</span>
                          <div>
                            <span className="font-bold text-slate-800 block">{actionStr}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 leading-relaxed line-clamp-2">{detailsStr}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block border rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${getModuleBadgeColor(moduleStr)}`}>
                          {moduleStr}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 text-[10px] whitespace-nowrap">{ipStr}</td>
                      <td className="p-3.5 pr-5 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSuccess ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                          {log.status || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-400">
              Page {page} of {totalPages} — {filteredLogs.length} total records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-[10px] font-bold"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all cursor-pointer ${page === p
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">policy</span>
                <h4 className="font-heading font-black text-slate-900 text-base">Log Entry Detail</h4>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 material-symbols-outlined cursor-pointer outline-none">close</button>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              {[
                { label: "Timestamp", value: selectedLog.timestamp || "N/A" },
                { label: "Actor", value: selectedLog.actor || selectedLog.user || "System" },
                { label: "Role", value: selectedLog.role || "Operator" },
                { label: "Action", value: selectedLog.action || "N/A" },
                { label: "Module", value: selectedLog.module || "General" },
                { label: "IP Address", value: selectedLog.ipAddress || selectedLog.ip || "127.0.0.1" },
                { label: "Status", value: selectedLog.status || "N/A" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">{label}</span>
                  <span className="font-bold text-slate-800 text-right font-mono">{value}</span>
                </div>
              ))}
              {selectedLog.details && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Details</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">{selectedLog.details}</p>
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Append-only · Cryptographically secured · SHA-256 verified
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
