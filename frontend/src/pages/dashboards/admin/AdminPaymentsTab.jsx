import React, { useState, useMemo } from "react";

const AdminPaymentsTab = ({
  payments = [],
  setPayments,
  user,
  invoices = [],
  showToast
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'retry' | 'refund', tx: object }
  const [isActionLoading, setIsActionLoading] = useState(false);

  const amountToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if ((num = num.toString()).length > 9) return 'OVERFLOW';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'rupees ' : '';
    return str.trim() ? str.trim().toUpperCase() + ' ONLY' : 'ZERO RUPEES';
  };

  const triggerRetry = (tx, e) => {
    e?.stopPropagation();
    setConfirmAction({ type: "retry", tx });
  };

  const triggerRefund = (tx, e) => {
    e?.stopPropagation();
    setConfirmAction({ type: "refund", tx });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    const { type, tx } = confirmAction;

    setTimeout(() => {
      if (type === "retry") {
        setPayments(payments.map(p => p.id === tx.id ? { ...p, status: "successful" } : p));
        showToast(`Payment transaction ${tx.id} retried and processed successfully!`, "success");
      } else if (type === "refund") {
        setPayments(payments.map(p => p.id === tx.id ? { ...p, status: "refunded" } : p));
        showToast(`Refund processed for transaction ${tx.id}.`, "info");
      }
      setIsActionLoading(false);
      setConfirmAction(null);

      if (selectedTransaction && selectedTransaction.id === tx.id) {
        setSelectedTransaction(prev => ({
          ...prev,
          status: type === "retry" ? "successful" : "refunded"
        }));
      }
    }, 1200);
  };

  const metrics = useMemo(() => {
    const totalRev = payments
      .filter(p => p.status?.toLowerCase() === "successful" || p.status?.toLowerCase() === "succeeded")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const successCount = payments.filter(p => p.status?.toLowerCase() === "successful" || p.status?.toLowerCase() === "succeeded").length;
    const failCount = payments.filter(p => p.status?.toLowerCase() === "failed").length;
    const pendCount = payments.filter(p => p.status?.toLowerCase() === "pending").length;

    const rate = payments.length > 0
      ? Math.round((successCount / payments.length) * 100)
      : 100;

    return { totalRev, successCount, failCount, pendCount, rate };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const statusLower = p.status?.toLowerCase();
      let matchesTab = true;
      if (activeTab === "failed") matchesTab = statusLower === "failed";
      else if (activeTab === "refunds") matchesTab = statusLower === "refund_requested" || statusLower === "refunded";
      else if (activeTab === "successful") matchesTab = statusLower === "successful" || statusLower === "succeeded";

      if (!matchesTab) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        p.id?.toLowerCase().includes(query) ||
        p.client?.toLowerCase().includes(query) ||
        p.method?.toLowerCase().includes(query) ||
        p.amount?.toString().includes(query) ||
        p.status?.toLowerCase().includes(query)
      );
    });
  }, [payments, activeTab, searchQuery]);

  const sortedPayments = useMemo(() => {
    const items = [...filteredPayments];
    return items.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });
  }, [filteredPayments, sortBy]);

  const exportToCSV = () => {
    const headers = ["Transaction ID", "Client", "Amount (INR)", "Date", "Status", "Gateway Method"];
    const rows = sortedPayments.map(p => [
      p.id,
      p.client,
      p.amount,
      p.date,
      p.status,
      p.method
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BillNest_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Transaction registry successfully exported as CSV.", "success");
  };

  const getTimelineSteps = (tx) => {
    const steps = [
      { label: "Transaction Initiated", desc: "Payment check-out request created by Client Payer portal.", date: tx.date, active: true },
    ];

    if (tx.status === "successful" || tx.status === "succeeded") {
      steps.push({ label: "Gateway Authorized", desc: `Secured authorization via ${tx.method}.`, date: tx.date, active: true });
      steps.push({ label: "Ledger Settled", desc: `Inbound funds reconciled in ${user?.organization?.name || "Workspace"} account.`, date: tx.date, active: true });
    } else if (tx.status === "failed") {
      steps.push({ label: "Gateway Rejection", desc: `Authorization failed during validation on ${tx.method}.`, date: tx.date, active: true, error: true });
    } else if (tx.status === "refund_requested") {
      steps.push({ label: "Gateway Settled", desc: `Secured authorization via ${tx.method}.`, date: tx.date, active: true });
      steps.push({ label: "Refund Dispatched", desc: "Refund claim initiated by admin. Awaiting clearance.", date: tx.date, active: true, warning: true });
    } else if (tx.status === "refunded") {
      steps.push({ label: "Gateway Settled", desc: `Secured authorization via ${tx.method}.`, date: tx.date, active: true });
      steps.push({ label: "Refund Disbursed", desc: "Disbursement approved. Outbound funds returned to Client card/bank source.", date: tx.date, active: true });
    } else if (tx.status === "pending") {
      steps.push({ label: "Processing Pipeline", desc: "Awaiting asynchronous gateway settlement webhook dispatch.", date: tx.date, active: true, pulse: true });
    }

    return steps;
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl select-none animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent"></div>
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                  Admin Control Console
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                  Active Ledger
                </span>
              </div>
              <h3 className="font-heading text-xl font-black text-white mt-1.5 tracking-tight">Payments & Transaction Center</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-1 max-w-2xl">
                Monitor invoices routed from client payers. As an administrator of <strong className="text-indigo-400">{user?.organization?.name || "the workspace"}</strong>, you have authority to override payment exceptions, process pending refund claims, and audit inbound client cashflows.
              </p>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer outline-none w-full md:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-all duration-300 group">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-bl-[80px] transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Revenue</span>
              <h3 className="font-heading text-2xl font-black text-slate-900 mt-1">₹{metrics.totalRev.toLocaleString("en-IN")}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {metrics.successCount} Successful bills
            </span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Inbound</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-all duration-300 group">
          <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-500/5 rounded-bl-[80px] transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Success Rate</span>
              <h3 className="font-heading text-2xl font-black text-slate-900 mt-1">{metrics.rate}%</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50">
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mb-1">
              <span>Performance Ratio</span>
              <span>{metrics.successCount}/{payments.length}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.rate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-all duration-300 group">
          <div className="absolute right-0 top-0 w-20 h-20 bg-rose-500/5 rounded-bl-[80px] transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Failed Exceptions</span>
              <h3 className="font-heading text-2xl font-black text-slate-900 mt-1">{metrics.failCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${metrics.failCount > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-350"}`}></span>
              {metrics.failCount > 0 ? `${metrics.failCount} active failures` : "Ledger fully healthy"}
            </span>
            <span className={`font-bold uppercase tracking-wider text-[9px] ${metrics.failCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
              {metrics.failCount > 0 ? "Needs Review" : "Secure"}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-all duration-300 group">
          <div className="absolute right-0 top-0 w-20 h-20 bg-amber-500/5 rounded-bl-[80px] transition-all duration-300 group-hover:scale-110"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pending Pipelines</span>
              <h3 className="font-heading text-2xl font-black text-slate-900 mt-1">{metrics.pendCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${metrics.pendCount > 0 ? "bg-amber-500 animate-pulse" : "bg-slate-350"}`}></span>
              {metrics.pendCount > 0 ? "Gateway pending check" : "No active pipeline"}
            </span>
            <span className="text-amber-600 font-bold uppercase tracking-wider text-[9px]">Awaiting</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(15,23,42,0.015)] space-y-5">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Transaction Registry</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Filter, search, and manage invoice payments</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:min-w-[260px]">
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 select-none">search</span>
              <input
                type="text"
                placeholder="Search Client, Transaction ID, Method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl py-2 pl-10 pr-9 text-xs font-semibold outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-2xl py-2 pl-3.5 pr-9 text-xs font-bold text-slate-600 outline-none cursor-pointer appearance-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
              <span className="material-symbols-outlined text-[16px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">expand_more</span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl items-center select-none w-full sm:w-auto justify-between sm:justify-start">
              {[
                { id: "all", label: "All Traces" },
                { id: "successful", label: "Successful" },
                { id: "failed", label: "Failed" },
                { id: "refunds", label: "Refunds" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab.id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 select-none">
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pl-2">Transaction ID</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Payer (Client)</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Receiver (Workspace)</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Gateway Method</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Date</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Amount</th>
                <th className="py-3.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Status</th>
                <th className="py-3.5 text-right text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-[32px] text-slate-300">receipt_long</span>
                      <p className="font-bold">No matching traces registered under the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedPayments.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedTransaction(p)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 font-mono font-black text-slate-800 pl-2 group-hover:text-indigo-600">{p.id}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-indigo-500">upload_file</span>
                          {p.client}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Payer (Outflow)</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-emerald-500">download_for_offline</span>
                          {user?.organization?.name || "Workspace"}
                        </span>
                        <span className="text-[8px] text-emerald-650 font-bold uppercase tracking-wider mt-0.5">Receiver (Inflow)</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg select-none">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400 font-medium">{p.date}</td>
                    <td className="py-4 font-black text-slate-900">₹{p.amount.toLocaleString("en-IN")}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border select-none ${p.status?.toLowerCase() === "successful" || p.status?.toLowerCase() === "succeeded"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : p.status?.toLowerCase() === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                          : p.status?.toLowerCase() === "refund_requested"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : p.status?.toLowerCase() === "refunded"
                              ? "bg-slate-50 text-slate-600 border-slate-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                        }`}>{p.status?.replace("_", " ")}</span>
                    </td>
                    <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                      {p.status === "failed" && (
                        <button
                          onClick={(e) => triggerRetry(p, e)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase cursor-pointer transition-all shadow-sm shadow-indigo-100 active:scale-95"
                        >
                          Retry Payment
                        </button>
                      )}
                      {p.status === "refund_requested" && (
                        <button
                          onClick={(e) => triggerRefund(p, e)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase cursor-pointer transition-all shadow-sm shadow-amber-100 active:scale-95"
                        >
                          Process Refund
                        </button>
                      )}
                      {p.status !== "failed" && p.status !== "refund_requested" && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Locked Ledger</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="block lg:hidden space-y-4">
          {sortedPayments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-350 text-[36px]">receipt_long</span>
              <p className="text-xs text-slate-500 font-bold mt-2">No matching transactions registered.</p>
            </div>
          ) : (
            sortedPayments.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedTransaction(p)}
                className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex flex-col gap-3.5 transition-all cursor-pointer hover:shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-black text-slate-800">{p.id}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{p.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Payer (Client)</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <span className="material-symbols-outlined text-[13px] text-indigo-500 flex-shrink-0">upload_file</span>
                      {p.client}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Receiver</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <span className="material-symbols-outlined text-[13px] text-emerald-500 flex-shrink-0">download_for_offline</span>
                      {user?.organization?.name || "Workspace"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100/60">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.method}</span>
                    <span className="font-black text-slate-900 text-sm mt-0.5">₹{p.amount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border select-none ${p.status?.toLowerCase() === "successful" || p.status?.toLowerCase() === "succeeded"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : p.status?.toLowerCase() === "failed"
                        ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                        : p.status?.toLowerCase() === "refund_requested"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : p.status?.toLowerCase() === "refunded"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>{p.status?.replace("_", " ")}</span>

                    {p.status === "failed" && (
                      <button
                        onClick={(e) => triggerRetry(p, e)}
                        className="bg-indigo-600 text-white text-[9px] px-2.5 py-1 rounded-md font-black uppercase cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                    {p.status === "refund_requested" && (
                      <button
                        onClick={(e) => triggerRefund(p, e)}
                        className="bg-amber-500 text-white text-[9px] px-2.5 py-1 rounded-md font-black uppercase cursor-pointer"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTransaction(null)}
          ></div>

          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-100 flex flex-col z-10 animate-slide-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Audit Inspection</span>
                <h3 className="font-heading text-base font-black text-slate-800 mt-0.5">Transaction Detail</h3>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-slate-400 hover:text-slate-650 hover:bg-slate-100/60 p-1.5 rounded-xl transition-all cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Settlement Amount</span>
                <h2 className="font-heading text-2xl font-black text-slate-900 leading-none">₹{selectedTransaction.amount.toLocaleString("en-IN")}</h2>
                <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md inline-block">
                  {selectedTransaction.method}
                </span>

                <div className="pt-2 text-[8px] text-slate-400 font-bold font-mono tracking-widest break-all select-all">
                  TXID: {selectedTransaction.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Outflow Source (Client)</span>
                  <div className="font-bold text-slate-800 text-xs mt-1 truncate">{selectedTransaction.client}</div>
                  <span className="text-[8px] text-slate-450 mt-0.5 block font-medium">Verified Payer Source</span>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Inflow Destination</span>
                  <div className="font-bold text-slate-800 text-xs mt-1 truncate">{user?.organization?.name || "Workspace"}</div>
                  <span className="text-[8px] text-slate-450 mt-0.5 block font-medium">Reconciled Corporate Space</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Financial Statement Wording</label>
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-[10px] font-bold text-slate-600 leading-relaxed font-mono">
                  {amountToWords(selectedTransaction.amount)}
                </div>
              </div>

              <div className="space-y-3.5">
                <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ledger State Dispatch Trace</label>

                <div className="relative pl-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 space-y-5">
                  {getTimelineSteps(selectedTransaction).map((step, idx) => (
                    <div key={idx} className="relative flex flex-col gap-0.5">
                      <span className={`absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white z-10 ${step.error
                        ? "bg-rose-500"
                        : step.warning
                          ? "bg-amber-500"
                          : step.pulse
                            ? "bg-amber-500 animate-pulse"
                            : "bg-indigo-600"
                        }`}></span>

                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{step.label}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{step.date}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              {selectedTransaction.status === "failed" && (
                <button
                  onClick={(e) => triggerRetry(selectedTransaction, e)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98] outline-none"
                >
                  Retry Payment Transaction
                </button>
              )}
              {selectedTransaction.status === "refund_requested" && (
                <button
                  onClick={(e) => triggerRefund(selectedTransaction, e)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98] outline-none"
                >
                  Confirm & Process Refund
                </button>
              )}
              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl cursor-pointer transition-all outline-none"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center font-sans">
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"></div>

          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl relative z-10 animate-scale-up text-center space-y-4">
            {isActionLoading ? (
              <div className="py-6 space-y-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="font-heading text-sm font-black text-slate-800">
                    {confirmAction.type === "retry" ? "Authorizing Gateway Retry..." : "Issuing Dispute Settlement..."}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Contacting multi-tenant gateway pipeline. Please hold.</p>
                </div>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${confirmAction.type === "retry"
                  ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                  : "bg-amber-50 border-amber-100 text-amber-600"
                  }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {confirmAction.type === "retry" ? "sync" : "history_card_user"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-heading text-sm font-black text-slate-800 uppercase tracking-wide">
                    {confirmAction.type === "retry" ? "Confirm Payment Override" : "Confirm Refund Dispatch"}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    {confirmAction.type === "retry"
                      ? `Are you sure you want to bypass gateway failure logs and authorize payment for transaction ${confirmAction.tx.id} of ₹${confirmAction.tx.amount.toLocaleString()}?`
                      : `Are you sure you want to issue a refund of ₹${confirmAction.tx.amount.toLocaleString()} for transaction ${confirmAction.tx.id}? Outbound ledger will update immediately.`
                    }
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConfirmAction}
                    className={`flex-1 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all shadow-sm ${confirmAction.type === "retry"
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                      : "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                      }`}
                  >
                    Confirm Action
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsTab;
