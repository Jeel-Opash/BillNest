import React, { useState, useMemo } from "react";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const ReportsTab = ({
  user,
  clients = [],
  invoices = [],
  subscriptions = [],
  payments = [],
  showToast
}) => {

  const [activeReport, setActiveReport] = useState("revenue");


  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("all");


  const filteredData = useMemo(() => {

    const invFiltered = invoices.filter(inv => {
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      const matchClient = selectedClient === "all" || inv.client === selectedClient;
      const matchStatus = selectedStatus === "all" || inv.status?.toLowerCase() === selectedStatus.toLowerCase();

      const clientDetails = clients.find(c => c.company === inv.client);
      const matchCurrency = selectedCurrency === "all" || (clientDetails?.currency || "INR") === selectedCurrency;

      return matchDate && matchClient && matchStatus && matchCurrency;
    });


    const payFiltered = payments.filter(p => {
      const matchDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);
      const matchClient = selectedClient === "all" || p.client === selectedClient;
      const matchStatus = selectedStatus === "all" || p.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchCurrency = selectedCurrency === "all" || (p.currency || "INR") === selectedCurrency;

      return matchDate && matchClient && matchStatus && matchCurrency;
    });


    const subFiltered = subscriptions.filter(s => {
      const matchClient = selectedClient === "all" || s.client === selectedClient;
      const matchStatus = selectedStatus === "all" || s.status?.toLowerCase() === selectedStatus.toLowerCase();
      return matchClient && matchStatus;
    });

    return {
      invoices: invFiltered,
      payments: payFiltered,
      subscriptions: subFiltered
    };
  }, [invoices, payments, subscriptions, clients, startDate, endDate, selectedClient, selectedStatus, selectedCurrency]);


  const reportMetrics = useMemo(() => {

    const grossRevenue = filteredData.payments
      .filter(p => p.status?.toLowerCase() === "succeeded")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refundedAmount = filteredData.payments
      .filter(p => p.status?.toLowerCase() === "refunded")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const netRevenue = grossRevenue - refundedAmount;


    const totalInvoicesVal = filteredData.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const paidInvoicesVal = filteredData.invoices
      .filter(inv => inv.status?.toLowerCase() === "paid")
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const outstandingInvoicesVal = filteredData.invoices
      .filter(inv => inv.status?.toLowerCase() === "sent" || inv.status?.toLowerCase() === "overdue")
      .reduce((sum, inv) => sum + Number(inv.amount), 0);



    const collectedTax = filteredData.invoices
      .filter(inv => inv.status?.toLowerCase() === "paid")
      .reduce((sum, inv) => {
        const amt = Number(inv.amount) || 0;

        return sum + Math.round(amt - (amt / 1.18));
      }, 0);

    return {
      grossRevenue,
      refundedAmount,
      netRevenue,
      totalInvoicesVal,
      paidInvoicesVal,
      outstandingInvoicesVal,
      collectedTax
    };
  }, [filteredData]);




  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `BillNest_${activeReport}_report.csv`;

    if (activeReport === "revenue") {
      headers = ["Transaction ID", "Client Name", "Reference Invoice", "Payment Method", "Date", "Gross Amount", "Status"];
      rows = filteredData.payments.map(p => [p.id, p.client, p.invoice, p.method || "Card", p.date, p.amount, p.status]);
    } else if (activeReport === "invoice") {
      headers = ["Invoice ID", "Client Partner", "Due Date", "Gross Amount", "Status"];
      rows = filteredData.invoices.map(inv => [inv.id, inv.client, inv.dueDate, inv.amount, inv.status]);
    } else if (activeReport === "client") {
      headers = ["Client Company Name", "Contact Email", "Phone Number", "Lifetime Revenue Generated"];
      rows = clients.map(c => {
        const clientRev = payments
          .filter(p => p.client === c.company && p.status?.toLowerCase() === "succeeded")
          .reduce((sum, p) => sum + p.amount, 0);
        return [c.company, c.email, c.phone, clientRev];
      });
    } else if (activeReport === "subscription") {
      headers = ["Plan Name", "Client Assigned", "Billing Cycle", "Contract Value", "Agreements Status"];
      rows = filteredData.subscriptions.map(s => [s.name, s.client, s.cycle, s.price, s.status]);
    } else if (activeReport === "tax") {
      headers = ["Invoice ID", "Client Partner", "Date", "Gross Paid Amount", "Estimated Tax Collected (18% GST)"];
      rows = filteredData.invoices
        .filter(inv => inv.status?.toLowerCase() === "paid")
        .map(inv => {
          const amt = Number(inv.amount) || 0;
          const tax = Math.round(amt - (amt / 1.18));
          return [inv.id, inv.client, inv.dueDate, amt, tax];
        });
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${activeReport.toUpperCase()} report exported in CSV format.`, "success");
  };


  const handleExportExcel = () => {
    let content = "";
    let filename = `BillNest_${activeReport}_sheet.xls`;

    if (activeReport === "revenue") {
      content = "Transaction ID\tClient Name\tInvoice Reference\tMethod\tDate\tAmount\tStatus\n" +
        filteredData.payments.map(p => `${p.id}\t${p.client}\t${p.invoice}\t${p.method}\t${p.date}\t${p.amount}\t${p.status}`).join("\n");
    } else {
      content = "Reference ID\tDetails/Client\tSchedule/Date\tAmount\tStatus\n" +
        filteredData.invoices.map(inv => `${inv.id}\t${inv.client}\t${inv.dueDate}\t${inv.amount}\t${inv.status}`).join("\n");
    }

    const blob = new Blob([content], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${activeReport.toUpperCase()} spreadsheet downloaded.`, "success");
  };


  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeReport.toUpperCase()} Report - BillNest Auditor</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
            h2 { font-size: 14px; color: #64748b; text-transform: uppercase; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-success { background-color: #ecfdf5; color: #047857; }
            .badge-pending { background-color: #eff6ff; color: #1d4ed8; }
            .total-panel { background-color: #f8fafc; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; margin-top: 30px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>BillNest SaaS Corporate Audit</h1>
          <h2>${activeReport} analytics statement - Scoped Context</h2>
          <p>Generated on: ${new Date().toLocaleDateString()} | Tenant Isolation ID: org_codenova</p>
          
          <table>
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Client Partner</th>
                <th>Status</th>
                <th>Date/Schedule</th>
                <th>Amount Value</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.invoices.map(inv => `
                <tr>
                  <td><strong>${inv.id}</strong></td>
                  <td>${inv.client}</td>
                  <td><span class="badge badge-success">${inv.status}</span></td>
                  <td>${inv.dueDate}</td>
                  <td>INR ${inv.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="total-panel">
            <span>Aggregated Report Value:</span>
            <span>INR ${reportMetrics.totalInvoicesVal.toLocaleString()}</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast("PDF compiler initialized in standalone window.", "success");
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Reports & Business Intelligence</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Evaluate corporate progress logs, tax filings, and subscription schedules with advanced data isolation filters.
          </p>
        </div>

        {/* Export Dropdown options */}
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl gap-1.5 shadow-sm">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
          >
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
            PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
          >
            <span className="material-symbols-outlined text-[14px]">csv</span>
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">table_chart</span>
            Excel
          </button>
        </div>
      </div>

      {/* Filters Toolbar Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-semibold">
        
        {/* Date Range Start */}
        <div>
          <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Start Date</label>
          <input
            type="date"
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">End Date</label>
          <input
            type="date"
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Target Client */}
        <div>
          <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Client Scoped</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Status Filter</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid / Active</option>
            <option value="sent">Sent / Pending</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void / Cancelled</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Currency Base</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            <option value="all">All Currencies</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

      </div>

      {/* Reports Center Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Report Category Picker */}
        <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 h-fit">
          {[
            { id: "revenue", label: "Revenue Report", desc: "Gross collections & reversals", symbol: "payments" },
            { id: "invoice", label: "Invoice Statement", desc: "Outstanding collection aging", symbol: "receipt_long" },
            { id: "client", label: "Client Performance", desc: "Client LTV rankings", symbol: "group" },
            { id: "subscription", label: "Subscription Audits", desc: "MRR schedule distributions", symbol: "autorenew" },
            { id: "tax", label: "Tax Filings Statement", desc: "Collected corporate GST/VAT", symbol: "percent" }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors outline-none cursor-pointer ${
                activeReport === r.id 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeReport === r.id ? "text-indigo-400" : "text-slate-400"}`}>
                {r.symbol}
              </span>
              <div>
                <span className="block text-xs font-bold leading-tight">{r.label}</span>
                <span className={`block text-[9px] mt-0.5 ${activeReport === r.id ? "text-slate-400" : "text-slate-400"}`}>
                  {r.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Report Visualizers */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          
          {/* CATEGORY 1: REVENUE REPORT */}
          {activeReport === "revenue" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Breakdown Summary</h4>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full font-bold">LIVE STATEMENT</span>
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 text-[9px] font-black uppercase mb-1">Gross Collections</span>
                  <span className="text-xl font-black text-slate-950">{formatCurrency(reportMetrics.grossRevenue)}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 text-[9px] font-black uppercase mb-1">Total Refunds Released</span>
                  <span className="text-xl font-black text-slate-950">{formatCurrency(reportMetrics.refundedAmount)}</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100/40 rounded-xl">
                  <span className="block text-indigo-500 text-[9px] font-black uppercase mb-1">Net Captured Income</span>
                  <span className="text-xl font-black text-indigo-700">{formatCurrency(reportMetrics.netRevenue)}</span>
                </div>
              </div>

              {/* Simulated Chart visualizer */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Gross Inflows trend</h5>
                <div className="w-full h-24 flex items-end gap-3.5 pt-2 relative">
                  <div className="w-full bg-slate-200 h-10 rounded"></div>
                  <div className="w-full bg-slate-200 h-16 rounded"></div>
                  <div className="w-full bg-slate-200 h-14 rounded"></div>
                  <div className="w-full bg-indigo-600 h-24 rounded"></div>
                  <div className="w-full bg-indigo-500 h-20 rounded"></div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2: INVOICE STATEMENT */}
          {activeReport === "invoice" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice Aging & Collections</h4>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full font-bold">STATEMENT STATUS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 text-[9px] font-black uppercase mb-1">Total Invoiced</span>
                  <span className="text-xl font-black text-slate-950">{formatCurrency(reportMetrics.totalInvoicesVal)}</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100/40 rounded-xl">
                  <span className="block text-emerald-600 text-[9px] font-black uppercase mb-1">Paid Invoices</span>
                  <span className="text-xl font-black text-emerald-700">{formatCurrency(reportMetrics.paidInvoicesVal)}</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100/40 rounded-xl">
                  <span className="block text-amber-600 text-[9px] font-black uppercase mb-1">Outstanding Receivables</span>
                  <span className="text-xl font-black text-amber-700">{formatCurrency(reportMetrics.outstandingInvoicesVal)}</span>
                </div>
              </div>

              {/* Invoices List for the filter range */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                    <tr>
                      <th className="p-2.5 pl-3">Invoice</th>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5 pr-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredData.invoices.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 pl-3 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="p-2.5">{inv.client}</td>
                        <td className="p-2.5 text-slate-400">{inv.dueDate}</td>
                        <td className="p-2.5 font-black text-slate-950">{formatCurrency(inv.amount)}</td>
                        <td className="p-2.5 pr-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORY 3: CLIENT PERFORMANCE */}
          {activeReport === "client" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Client Revenue Leaderboard</h4>
                <span className="text-[10px] text-slate-500 font-bold">LTV METRIC</span>
              </div>

              {/* Client metrics rankings */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                    <tr>
                      <th className="p-2.5 pl-3">Client Company</th>
                      <th className="p-2.5">Contact Partner</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5 pr-3 text-right">Lifetime gross revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {clients.map((c, idx) => {
                      const clientRev = payments
                        .filter(p => p.client === c.company && p.status?.toLowerCase() === "succeeded")
                        .reduce((sum, p) => sum + p.amount, 0);

                      return (
                        <tr key={idx}>
                          <td className="p-2.5 pl-3 font-bold text-slate-950">{c.company}</td>
                          <td className="p-2.5 text-slate-500">{c.name}</td>
                          <td className="p-2.5 text-slate-400 font-mono">{c.email}</td>
                          <td className="p-2.5 pr-3 text-right font-black text-indigo-600">{formatCurrency(clientRev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORY 4: SUBSCRIPTION AUDITS */}
          {activeReport === "subscription" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Subscription Tier Audits</h4>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full font-bold">MRR BREAKDOWN</span>
              </div>

              {/* Subscription distributions list */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                    <tr>
                      <th className="p-2.5 pl-3">Subscription Contract</th>
                      <th className="p-2.5">Client Assigned</th>
                      <th className="p-2.5">Billing cycle</th>
                      <th className="p-2.5">Agreements status</th>
                      <th className="p-2.5 pr-3 text-right">Pricing (Base)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredData.subscriptions.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 pl-3 font-bold text-slate-900">{sub.name}</td>
                        <td className="p-2.5 text-slate-500">{sub.client}</td>
                        <td className="p-2.5 uppercase text-indigo-600 text-[10px]">{sub.cycle || "monthly"}</td>
                        <td className="p-2.5">
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                            {sub.status || "active"}
                          </span>
                        </td>
                        <td className="p-2.5 pr-3 text-right font-black text-slate-950">{formatCurrency(sub.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORY 5: TAX FILINGS STATEMENT */}
          {activeReport === "tax" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Corporate GST/VAT Audit Filings</h4>
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full font-bold">ESTIMATED TAX LIABILITY</span>
              </div>

              {/* Tax totals info panel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-slate-400 text-[9px] font-black uppercase mb-1">Total Estimated GST Collected (18% inclusive)</span>
                  <span className="text-xl font-black text-indigo-700">{formatCurrency(reportMetrics.collectedTax)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase">Ready for Filing</span>
                </div>
              </div>

              {/* Tax breakdown table list */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                    <tr>
                      <th className="p-2.5 pl-3">Invoice Ref</th>
                      <th className="p-2.5">Client Company</th>
                      <th className="p-2.5">Clearance Date</th>
                      <th className="p-2.5">Gross Paid</th>
                      <th className="p-2.5 pr-3 text-right">Tax Component (18% GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredData.invoices
                      .filter(inv => inv.status?.toLowerCase() === "paid")
                      .map((inv, idx) => {
                        const amt = Number(inv.amount) || 0;
                        const tax = Math.round(amt - (amt / 1.18));

                        return (
                          <tr key={idx}>
                            <td className="p-2.5 pl-3 font-mono font-bold text-slate-900">{inv.id}</td>
                            <td className="p-2.5">{inv.client}</td>
                            <td className="p-2.5 text-slate-400">{inv.dueDate}</td>
                            <td className="p-2.5 font-bold text-slate-950">{formatCurrency(inv.amount)}</td>
                            <td className="p-2.5 pr-3 text-right font-black text-emerald-600">{formatCurrency(tax)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default ReportsTab;
