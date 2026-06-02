import React, { useState, useMemo } from "react";

const MemberInvoicesTab = ({
  invoices,
  setInvoices,
  clients,
  user,
  showToast
}) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Form parameters
  const [builderClient, setBuilderClient] = useState(clients[0]?.company || "");
  const [builderNumber, setBuilderNumber] = useState(`INV-MEMB-${String(invoices.length + 1).padStart(4, "0")}`);
  const [builderDueDate, setBuilderDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [builderItems, setBuilderItems] = useState([]);
  const [builderDiscount, setBuilderDiscount] = useState(0);
  const [builderTaxRate, setBuilderTaxRate] = useState(18);

  // Item builder states
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const resetBuilder = () => {
    setEditingInvoice(null);
    setBuilderClient(clients[0]?.company || "");
    setBuilderNumber(`INV-MEMB-${String(invoices.length + 1).padStart(4, "0")}`);
    setBuilderDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
    setBuilderItems([]);
    setBuilderDiscount(0);
    setBuilderTaxRate(18);
    resetItemInputs();
  };

  const resetItemInputs = () => {
    setItemDesc("");
    setItemQty(1);
    setItemPrice(0);
  };

  const appendLineItem = () => {
    if (!itemDesc.trim() || itemPrice <= 0) {
      showToast("Please provide item description and unit price.", "warning");
      return;
    }
    setBuilderItems([...builderItems, { desc: itemDesc, qty: itemQty, price: itemPrice }]);
    resetItemInputs();
  };

  const removeLineItem = (idx) => {
    setBuilderItems(builderItems.filter((_, i) => i !== idx));
  };

  // Math derivations
  const subtotal = useMemo(() => {
    return builderItems.reduce((acc, curr) => acc + curr.qty * curr.price, 0);
  }, [builderItems]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal - builderDiscount) * (builderTaxRate / 100));
  }, [subtotal, builderDiscount, builderTaxRate]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - builderDiscount + taxAmount);
  }, [subtotal, builderDiscount, taxAmount]);

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    if (builderItems.length === 0) {
      showToast("Invoices must contain at least one billing item.", "warning");
      return;
    }

    if (editingInvoice) {
      setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? {
        ...inv,
        client: builderClient,
        dueDate: builderDueDate,
        amount: finalTotal,
        itemsList: builderItems,
        discount: builderDiscount,
        taxRate: builderTaxRate
      } : inv));
      showToast(`Draft ${editingInvoice.id} updated.`, "success");
    } else {
      const newInv = {
        id: builderNumber,
        client: builderClient,
        date: new Date().toISOString().split("T")[0],
        dueDate: builderDueDate,
        amount: finalTotal,
        status: "draft",
        itemsList: builderItems,
        discount: builderDiscount,
        taxRate: builderTaxRate
      };
      setInvoices([newInv, ...invoices]);
      showToast(`Draft Invoice ${builderNumber} created.`, "success");
    }
    resetBuilder();
  };

  const handleEditClick = (inv) => {
    setEditingInvoice(inv);
    setBuilderClient(inv.client);
    setBuilderNumber(inv.id);
    setBuilderDueDate(inv.dueDate);
    setBuilderItems(inv.itemsList || [{ desc: "Consultancy retainer", qty: 1, price: inv.amount }]);
    setBuilderDiscount(inv.discount || 0);
    setBuilderTaxRate(inv.taxRate || 18);
  };

  const handleSend = (id) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "sent" } : inv));
    showToast(`Invoice ${id} dispatched to client inbox.`, "success");
  };

  const handleDuplicate = (inv) => {
    const duplicatedNum = `INV-M-COPY-${Date.now().toString().slice(-4)}`;
    const duplicatedInv = {
      ...inv,
      id: duplicatedNum,
      date: new Date().toISOString().split("T")[0],
      status: "draft"
    };
    setInvoices([duplicatedInv, ...invoices]);
    showToast(`Duplicated to new Draft ${duplicatedNum}.`, "info");
  };

  // Voiding and Paid Invoice Deletion restriction check
  const handleDeleteInvoice = (id, status) => {
    if (status === "paid") {
      showToast("❌ Compliance Lock: Members cannot delete resolved Paid invoices.", "error");
      return;
    }
    setInvoices(invoices.filter(inv => inv.id !== id));
    showToast(`Invoice ${id} permanently removed.`, "info");
  };

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
            BillNest Invoicing Ecosystem • Workspace Member Scoped Document
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF generated for ${inv.id}!`, "success");
  };

  const filteredInvoices = invoices.filter(inv => filterStatus === "all" || inv.status === filterStatus);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Invoices history list */}
      <div className="lg:col-span-7 space-y-6">

        {/* Categories filters */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap gap-2 text-xs font-semibold select-none">
          {[
            { id: "all", label: "All Bills" },
            { id: "draft", label: "Drafts" },
            { id: "sent", label: "Sent / Dispatched" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue Alerts" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Invoice list table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">My Generated Invoices</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredInvoices.length} invoices
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No matching draft records resolved under the selected category.
              </div>
            ) : (
              filteredInvoices.map(inv => {
                const isPaid = inv.status === "paid";
                return (
                  <div key={inv.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm leading-none">{inv.id}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : inv.status === "sent"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : inv.status === "overdue"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>{inv.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1.5">Client: {inv.client}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Due date: {inv.dueDate}</p>
                    </div>

                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2.5 w-full sm:w-auto">
                      <h5 className="font-black text-slate-900 text-sm">₹{inv.amount.toLocaleString()}</h5>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => handleSend(inv.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer shadow-sm shadow-indigo-100"
                          >
                            Send
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(inv)}
                          className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => downloadPrintHtml(inv)}
                          className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleEditClick(inv)}
                          className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        
                        {/* Void restrictions checklist check */}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.status)}
                          disabled={isPaid}
                          className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase transition-all ${
                            isPaid
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border-transparent"
                              : "bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 cursor-pointer"
                          }`}
                          title={isPaid ? "Members cannot delete paid invoices" : "Delete Draft"}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right side: Drafting Builder */}
      <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          {editingInvoice ? `Editing ${editingInvoice.id}` : "Draft Billing Invoice"}
        </h4>

        <form onSubmit={handleSaveInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Client Target</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer outline-none text-slate-700"
                value={builderClient}
                onChange={(e) => setBuilderClient(e.target.value)}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.company}>{c.company}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold cursor-pointer outline-none text-slate-700"
                value={builderDueDate}
                onChange={(e) => setBuilderDueDate(e.target.value)}
              />
            </div>
          </div>

          {!editingInvoice && (
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                value={builderNumber}
                onChange={(e) => setBuilderNumber(e.target.value)}
              />
            </div>
          )}

          {/* Append item box */}
          <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
            <span className="block font-heading text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Item Rows</span>
            
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Description"
                className="col-span-6 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />
              <input
                type="number"
                placeholder="Qty"
                className="col-span-2 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                min="1"
                value={itemQty}
                onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
              />
              <input
                type="number"
                placeholder="Price"
                className="col-span-4 bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                min="0"
                value={itemPrice}
                onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)}
              />
            </div>

            <button
              type="button"
              onClick={appendLineItem}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer"
            >
              + Append Row
            </button>
          </div>

          {/* Checklist preview */}
          {builderItems.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Items Ledger:</span>
              {builderItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-2 text-xs border border-slate-100 rounded-xl">
                  <span className="font-semibold text-slate-600">{item.desc} (x{item.qty})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">₹{(item.qty * item.price).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-rose-600 hover:text-rose-800 material-symbols-outlined text-[16px] cursor-pointer"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={builderDiscount}
                onChange={(e) => setBuilderDiscount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={builderTaxRate}
                onChange={(e) => setBuilderTaxRate(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* calculations box */}
          <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-slate-800">₹{subtotal.toLocaleString()}</span>
            </div>
            {builderDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Deduction</span>
                <span>- ₹{builderDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-600">
              <span>Tax Assessment (GST {builderTaxRate}%)</span>
              <span>+ ₹{taxAmount.toLocaleString()}</span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between font-extrabold text-sm text-indigo-600">
              <span>Final Total</span>
              <span>₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              {editingInvoice ? "Save Invoice Draft" : "Draft Billing Invoice"}
            </button>
            <button
              type="button"
              onClick={resetBuilder}
              className="px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default MemberInvoicesTab;
