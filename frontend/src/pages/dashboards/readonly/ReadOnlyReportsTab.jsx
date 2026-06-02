import React, { useState } from "react";

const ReadOnlyReportsTab = ({
  invoices,
  clients,
  user,
  showToast
}) => {
  const [reportType, setReportType] = useState("revenue");
  const [filterClient, setFilterClient] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const filteredInvoices = invoices.filter(inv => {
    const matchesClient = filterClient === "all" || inv.client === filterClient;
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchesDate = inv.date >= startDate && inv.date <= endDate;
    return matchesClient && matchesStatus && matchesDate;
  });

  const grossInvoiced = filteredInvoices.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = filteredInvoices.filter(i => i.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const taxEst = Math.round(totalPaid * 0.18);

  const handleExportCSV = () => {
    const headers = ["Invoice ID", "Client Name", "Billing Date", "Due Date", "Status", "Amount (INR)"];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.client,
      inv.date,
      inv.dueDate,
      inv.status,
      inv.amount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billnest_readonly_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV ledger downloaded successfully!", "success");
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Allow popups to render report statements.", "error");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportType.toUpperCase()} Statement - ${user?.organization?.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card-title { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .card-value { font-size: 20px; font-weight: bold; margin-top: 8px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; font-weight: bold; font-size: 11px; color: #475569; }
            td { font-size: 12px; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BillNest Executive ${reportType.toUpperCase()} Statement</div>
            <div class="meta">Organization: ${user?.organization?.name || "CodeCraft Agency"} | Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Gross Volume Invoiced</div>
              <div class="card-value">₹${grossInvoiced.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Paid Revenue Mapped</div>
              <div class="card-value">₹${totalPaid.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Tax liability assessment (18% GST)</div>
              <div class="card-value">₹${taxEst.toLocaleString()}</div>
            </div>
          </div>
          
          <h3>Statement details</h3>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map(inv => `
                <tr>
                  <td><strong>${inv.id}</strong></td>
                  <td>${inv.client}</td>
                  <td>${inv.date}</td>
                  <td><span style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: ${inv.status === 'paid' ? '#10b981' : '#f59e0b'}">${inv.status}</span></td>
                  <td>₹${inv.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <div class="footer">
            BillNest isolated tenant secure auditing report statement. Mapped under observer access.
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF report generated for ${reportType}!`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left Column: Filter drawer & ledger */}
      <div className="lg:col-span-8 space-y-6">

        {/* Filter controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4 select-none">
            Auditing Filter parameters
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Report Target</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="revenue">Gross Revenue Report</option>
                <option value="client">Client Allocation Report</option>
                <option value="invoice">Invoice Roster Report</option>
                <option value="subscription">Subscriptions Report</option>
                <option value="tax">Tax Assessment Report</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Client Target</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status Type</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="sent">Sent / Dispatched</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Start Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold cursor-pointer outline-none text-slate-700" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">End Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold cursor-pointer outline-none text-slate-700" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Visual Ledger table preview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Filtered Statement Ledger</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredInvoices.length} entries
            </span>
          </div>

          <div className="space-y-3 text-xs font-semibold text-slate-600">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No matching entries under the selected filter filters.</div>
            ) : (
              filteredInvoices.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-black text-slate-900">{inv.id}</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{inv.client} | {inv.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900">₹{inv.amount.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase">{inv.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Actions */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 select-none">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Export Document Summaries
        </h4>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-[10px] text-slate-500 font-semibold">
          <div className="flex justify-between">
            <span>Invoiced volume</span>
            <span className="font-black text-slate-800">₹{grossInvoiced.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid Revenue volume</span>
            <span className="font-black text-slate-800">₹{totalPaid.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleExportCSV}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            Export as Spreadsheet (.CSV)
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            Export Tax PDF Summary
          </button>
        </div>
      </div>

    </div>
  );
};

export default ReadOnlyReportsTab;
