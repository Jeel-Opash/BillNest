import React, { useState } from "react";

const ReadOnlyInvoicesTab = ({
  invoices,
  user,
  showToast
}) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const downloadPrintHtml = (inv) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Allow popups to render the statement.", "error");
      return;
    }

    const items = inv.itemsList || [{ desc: "Workspace services", qty: 1, price: inv.amount }];
    const disc = inv.discount || 0;
    const rate = inv.taxRate || 18;
    const sub = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = Math.round((sub - disc) * (rate / 100));

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; }
            .header-panel { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .meta { font-size: 11px; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            th { background: #f8fafc; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; }
            td { font-size: 12px; }
            .totals { width: 300px; margin-left: auto; margin-top: 30px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .footer { text-align: center; margin-top: 60px; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header-panel">
            <div>
              <div class="brand">BillNest Invoicing</div>
              <p style="font-size: 11px; color:#64748b; margin-top:4px;">Workspace: ${user?.organization?.name || "CodeCraft Agency"}</p>
            </div>
            <div class="meta">
              <h3>${inv.id}</h3>
              <p>Issued: ${inv.date} | Due: ${inv.dueDate}</p>
              <p>Client Target: ${inv.client}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td><strong>${item.desc}</strong></td>
                  <td>${item.qty}</td>
                  <td>₹${item.price.toLocaleString()}</td>
                  <td>₹${(item.qty * item.price).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>₹${sub.toLocaleString()}</span></div>
            ${disc > 0 ? `<div class="total-row" style="color:#e11d48;"><span>Discount:</span><span>- ₹${disc.toLocaleString()}</span></div>` : ""}
            <div class="total-row" style="color:#16a34a;"><span>Tax (GST ${rate}%):</span><span>+ ₹${tax.toLocaleString()}</span></div>
            <hr/>
            <div class="total-row" style="font-size:14px; font-weight:800; color:#4f46e5;"><span>Total Due:</span><span>₹${inv.amount.toLocaleString()}</span></div>
          </div>

          <div class="footer">
            BillNest Invoicing Ecosystem • Workspace Observer Scoped Document
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF generated for ${inv.id}!`, "success");
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(search.toLowerCase()) || inv.client.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">

      {/* Compliance banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
        <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
        <div>
          <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Invoicing Ledger constraints</h5>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
            Your observer credentials grant full read access to invoice history, line items, and print systems. Generating new billing records, editing parameters, voiding, or deleting ledger items is restricted.
          </p>
        </div>
      </div>

      {/* Filters and search drawer */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 justify-between items-center select-none">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search invoice number or client company..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: "all", label: "All Bills" },
            { id: "draft", label: "Drafts" },
            { id: "sent", label: "Sent / Pending" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices roster listing */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3 select-none">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Workspace Invoices</h4>
          <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
            {filteredInvoices.length} invoices
          </span>
        </div>

        <div className="space-y-3.5">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No matching records resolved.
            </div>
          ) : (
            filteredInvoices.map(inv => (
              <div key={inv.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm leading-none">{inv.id}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      inv.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : inv.status === "sent"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>{inv.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5">Client Target: {inv.client}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Issued: {inv.date} | Due Date: {inv.dueDate}</p>
                </div>

                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2.5 w-full sm:w-auto">
                  <h5 className="font-black text-slate-900 text-sm">₹{inv.amount.toLocaleString()}</h5>
                  
                  <div className="flex gap-1.5 select-none">
                    <button
                      onClick={() => downloadPrintHtml(inv)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase transition-all cursor-pointer shadow-sm shadow-indigo-100"
                    >
                      Print PDF / Export
                    </button>
                    
                    {/* Visual locked warning for modifications */}
                    <div
                      className="w-7 h-7 rounded-lg bg-slate-100 border border-transparent text-slate-400 flex items-center justify-center cursor-not-allowed"
                      title="Editing or voiding invoices is restricted"
                    >
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default ReadOnlyInvoicesTab;
