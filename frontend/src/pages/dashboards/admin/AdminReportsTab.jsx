import React, { useState } from "react";

const AdminReportsTab = ({
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

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];

    if (reportType === "revenue") {
      headers = ["Invoice ID", "Client", "Amount (INR)", "Date", "Status"];
      rows = invoices.map(i => [i.id, i.client, i.amount, i.date, i.status]);
    } else if (reportType === "client") {
      headers = ["Client Name", "POC Name", "Email", "Currency"];
      rows = clients.map(c => [c.company, c.name, c.email, c.currency]);
    } else if (reportType === "invoice") {
      headers = ["Invoice Number", "Client", "Total Due", "Due Date", "Status"];
      rows = invoices.map(i => [i.id, i.client, i.amount, i.dueDate, i.status]);
    } else {
      headers = ["Client", "Mock Subscription Plan", "Price", "Billing Cycle"];
      rows = [
        ["ABC Restaurant", "Growth Plan", 9900, "monthly"],
        ["Pixel Studio", "Starter Tier", 2900, "monthly"]
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billnest_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`CSV ${reportType.toUpperCase()} report exported.`, "success");
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocker active. Allow popups to generate statement.", "error");
      return;
    }

    const reportRows = invoices.filter(inv => {
      const matchClient = filterClient === "all" || inv.client === filterClient;
      const matchStatus = filterStatus === "all" || inv.status === filterStatus;
      return matchClient && matchStatus;
    });

    const totalRevenue = reportRows.reduce((sum, inv) => sum + inv.amount, 0);
    const taxLiab = Math.round(totalRevenue * 0.18);

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportType.toUpperCase()} Tax Summary Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .brand { font-size: 22px; font-weight: 800; color: #4f46e5; }
            .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; rounded: 12px; }
            .val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; font-weight: 800; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">BillNest Corporate ${reportType.toUpperCase()} Statement</div>
            <div class="meta">Workspace Owner: ${user?.organization?.name || "CodeCraft Agency"} | Generated: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="summary-grid">
            <div class="card">
              <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Gross Invoiced</div>
              <div class="val">₹${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Tax Assessments</div>
              <div class="val">₹${taxLiab.toLocaleString()}</div>
            </div>
            <div class="card">
              <div style="font-size:10px; color:#64748b; font-weight:800; text-transform:uppercase;">Active Currencies</div>
              <div class="val">INR / USD</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Client Target</th>
                <th>Dispatch Stamp</th>
                <th>Status</th>
                <th>Ledger Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows.map(inv => `
                <tr>
                  <td><strong>${inv.id}</strong></td>
                  <td>${inv.client}</td>
                  <td>${inv.date}</td>
                  <td><span style="text-transform:uppercase; font-size:10px; font-weight:800; color:${inv.status === 'paid' ? '#10b981' : '#f59e0b'}">${inv.status}</span></td>
                  <td>₹${inv.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF generated for ${reportType.toUpperCase()} report!`, "success");
  };

  // Filter values
  const filteredInvoices = invoices.filter(inv => {
    const matchClient = filterClient === "all" || inv.client === filterClient;
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchStart = !startDate || inv.date >= startDate;
    const matchEnd = !endDate || inv.date <= endDate;
    return matchClient && matchStatus && matchStart && matchEnd;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Report Filters */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Report Parameters
        </h4>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Select Report Type</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="revenue">Revenue Report</option>
            <option value="client">Client Roster Report</option>
            <option value="invoice">Invoice Dispatches Report</option>
            <option value="subscription">Subscriptions Schedule Report</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Filter by Client</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          >
            <option value="all">All Workspace Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.company}>{c.company}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Filter by Invoice Status</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none text-slate-700"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none text-slate-700"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-50">
          <button
            onClick={handleExportCSV}
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Right side: Report Preview Grid */}
      <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Statement Ledger Preview</h4>
          <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
            {filteredInvoices.length} entries matching
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Invoice Ref</th>
                <th className="py-2.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Client Target</th>
                <th className="py-2.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Dispatched</th>
                <th className="py-2.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Status</th>
                <th className="py-2.5 text-right text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Ledger Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No matching traces detected. Modify report date filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{inv.id}</td>
                    <td className="py-3 text-slate-800">{inv.client}</td>
                    <td className="py-3 text-slate-400">{inv.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : inv.status === "sent"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">₹{inv.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminReportsTab;
