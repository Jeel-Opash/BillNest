import React, { useState, useMemo } from "react";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const InvoicesTab = ({
  clients = [],
  invoices = [],
  setInvoices,
  showToast
}) => {

  const [currentSubTab, setCurrentSubTab] = useState("all");


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editorInvNumber, setEditorInvNumber] = useState("");
  const [editorClient, setEditorClient] = useState("");
  const [editorDueDate, setEditorDueDate] = useState("");
  const [editorDiscount, setEditorDiscount] = useState(0);
  const [editorTaxRate, setEditorTaxRate] = useState(18);
  const [editorNotes, setEditorNotes] = useState("");
  

  const [editorItems, setEditorItems] = useState([]);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);


  const editorSubtotal = useMemo(() => {
    return editorItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
  }, [editorItems]);

  const editorDiscountAmount = useMemo(() => {
    return Math.round(editorSubtotal * (editorDiscount / 100));
  }, [editorSubtotal, editorDiscount]);

  const editorTaxAmount = useMemo(() => {
    return Math.round((editorSubtotal - editorDiscountAmount) * (editorTaxRate / 100));
  }, [editorSubtotal, editorDiscountAmount, editorTaxRate]);

  const editorFinalTotal = useMemo(() => {
    return Math.max(0, editorSubtotal - editorDiscountAmount + editorTaxAmount);
  }, [editorSubtotal, editorDiscountAmount, editorTaxAmount]);




  const handleMarkPaid = (invId) => {
    setInvoices(invoices.map(i => i.id === invId ? { ...i, status: "paid" } : i));
    showToast(`Invoice ${invId} successfully marked as PAID.`, "success");
  };


  const handleVoidInvoice = (invId) => {
    setInvoices(invoices.map(i => i.id === invId ? { ...i, status: "void" } : i));
    showToast(`Invoice ${invId} has been VOIDED.`, "info");
  };


  const handleSendInvoice = (invId) => {
    setInvoices(invoices.map(i => i.id === invId ? { ...i, status: "sent" } : i));
    showToast(`Invoice ${invId} successfully sent to client. Status updated to SENT.`, "success");
  };


  const handleDuplicateInvoice = (inv) => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const duplicated = {
      ...inv,
      id: `INV-${nextNum}`,
      date: new Date().toISOString().split("T")[0],
      status: "draft"
    };
    setInvoices([duplicated, ...invoices]);
    showToast(`Invoice ${inv.id} duplicated into new Draft INV-${nextNum}!`, "success");
  };


  const handleDeleteInvoice = (invId) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invId}?`)) {
      setInvoices(invoices.filter(i => i.id !== invId));
      showToast(`Invoice ${invId} deleted.`, "info");
    }
  };


  const handleLoadEditDraft = (inv) => {
    if (inv.status !== "draft") {
      showToast("Only DRAFT invoices can be edited.", "error");
      return;
    }
    setEditingInvoiceId(inv.id);
    setEditorInvNumber(inv.id);
    setEditorClient(inv.client);
    setEditorDueDate(inv.dueDate);
    setEditorDiscount(inv.discount || 0);
    setEditorTaxRate(inv.taxRate || 18);
    setEditorNotes(inv.notes || "");
    setEditorItems(inv.items || []);
    setCurrentSubTab("editor");
    showToast(`Draft ${inv.id} loaded into Editor.`, "info");
  };


  const handleInitCreateTab = () => {
    setEditingInvoiceId(null);
    setEditorInvNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setEditorClient(clients[0]?.company || "ABC Restaurant");
    setEditorDueDate(new Date(Date.now() + 14*24*60*60*1000).toISOString().split("T")[0]);
    setEditorDiscount(0);
    setEditorTaxRate(18);
    setEditorNotes("Payment terms: 14 days net. Bank transfers preferred.");
    setEditorItems([]);
    setCurrentSubTab("editor");
  };


  const handleEditorAddItem = (e) => {
    e.preventDefault();
    if (!newItemDesc.trim() || newItemQty <= 0 || newItemPrice < 0) return;
    setEditorItems([...editorItems, { desc: newItemDesc, qty: newItemQty, price: newItemPrice }]);
    setNewItemDesc("");
    setNewItemQty(1);
    setNewItemPrice(0);
  };


  const handleEditorDeleteItem = (idx) => {
    setEditorItems(editorItems.filter((_, i) => i !== idx));
  };


  const handleSaveEditor = (e, targetStatus = "draft") => {
    e.preventDefault();
    if (!editorItems.length) {
      showToast("Please add at least one line item.", "error");
      return;
    }

    const savedInvoice = {
      id: editorInvNumber,
      client: editorClient,
      amount: editorFinalTotal,
      date: new Date().toISOString().split("T")[0],
      dueDate: editorDueDate,
      status: targetStatus,
      items: editorItems,
      discount: editorDiscount,
      taxRate: editorTaxRate,
      notes: editorNotes
    };

    if (editingInvoiceId) {

      setInvoices(invoices.map(i => i.id === editingInvoiceId ? savedInvoice : i));
      showToast(`Invoice Draft ${editorInvNumber} saved successfully.`, "success");
    } else {


      if (invoices.some(i => i.id === editorInvNumber)) {
        showToast(`Invoice number ${editorInvNumber} already exists. Incrementing ID.`, "warning");
        savedInvoice.id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      setInvoices([savedInvoice, ...invoices]);
      showToast(`Invoice ${savedInvoice.id} created as ${targetStatus.toUpperCase()}!`, "success");
    }

    setCurrentSubTab("all");
    setEditingInvoiceId(null);
  };


  const handleCustomGeneratePDF = (inv) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocker enabled. Please allow pop-ups for BillNest to export PDF.", "error");
      return;
    }

    const matchedClient = clients.find(c => c.company === inv.client);
    

    const subtotal = inv.items?.reduce((acc, it) => acc + (it.qty * it.price), 0) || inv.amount;
    const discPct = inv.discount || 0;
    const discountVal = Math.round(subtotal * (discPct / 100));
    const taxPct = inv.taxRate || 18;
    const taxVal = Math.round((subtotal - discountVal) * (taxPct / 100));

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.id} - ${inv.client}</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; background-color: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
            .header-row { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
            .company-name { font-size: 26px; font-weight: 900; color: #0f172a; tracking-tight; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #4f46e5; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; }
            .metadata-row { display: flex; justify-content: space-between; margin-bottom: 35px; font-size: 13px; }
            .bill-to { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; text-align: left; }
            .table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .text-right { text-align: right !important; }
            .totals-section { display: flex; justify-content: flex-end; }
            .totals-table { width: 320px; border-collapse: collapse; font-size: 13px; }
            .totals-table td { padding: 9px 12px; }
            .grand-total { font-size: 20px; font-weight: 900; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 14px !important; }
            .notes-card { margin-top: 40px; padding: 16px; background-color: #f8fafc; border-radius: 12px; font-size: 12px; border-left: 4px solid #4f46e5; }
            .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-row">
              <div>
                <div class="company-name">BillNest SaaS Platform</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: bold;">CRYPTOGRAPHICALLY SECURED WORKSPACE LEDGER</div>
              </div>
              <div class="invoice-title">INVOICE</div>
            </div>

            <div class="metadata-row">
              <div>
                <div class="bill-to">Bill To:</div>
                <div style="font-weight: 800; font-size: 16px; color: #0f172a;">${inv.client}</div>
                ${matchedClient ? `<div style="color: #64748b; margin-top: 4px; line-height: 1.4;">GSTIN: ${matchedClient.taxId || "Unregistered"}<br/>Address: ${matchedClient.address || "Local Entity"}</div>` : '<div style="color: #64748b; margin-top: 4px;">Isolated Client Entity</div>'}
              </div>
              <div style="text-align: right; line-height: 1.7; font-size: 13px;">
                <div><strong>Invoice Reference:</strong> ${inv.id}</div>
                <div><strong>Issue Date:</strong> ${inv.date}</div>
                <div><strong>Payment Due:</strong> ${inv.dueDate}</div>
                <div><strong>Status:</strong> <span style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: ${inv.status === 'paid' ? '#10b981' : '#ef4444'}">${inv.status}</span></div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right" style="width: 80px;">Qty</th>
                  <th class="text-right" style="width: 120px;">Rate</th>
                  <th class="text-right" style="width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${inv.items?.map(item => `
                  <tr>
                    <td><strong>${item.desc}</strong></td>
                    <td class="text-right" style="color: #64748b;">${item.qty}</td>
                    <td class="text-right" style="color: #64748b;">₹${item.price.toLocaleString()}</td>
                    <td class="text-right" style="font-weight: bold; color: #0f172a;">₹${(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                `).join("") || `<tr><td colspan="4">Service fee standard</td></tr>`}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td style="color: #64748b;">Subtotal</td>
                  <td class="text-right" style="font-weight: bold; color: #0f172a;">₹${subtotal.toLocaleString()}</td>
                </tr>
                ${discountVal > 0 ? `
                  <tr style="color: #dc2626; font-weight: bold;">
                    <td>Discount (${discPct}%)</td>
                    <td class="text-right">- ₹${discountVal.toLocaleString()}</td>
                  </tr>
                ` : ""}
                ${taxVal > 0 ? `
                  <tr>
                    <td style="color: #64748b;">Tax Registration (GST ${taxPct}%)</td>
                    <td class="text-right" style="font-weight: bold; color: #0f172a;">+ ₹${taxVal.toLocaleString()}</td>
                  </tr>
                ` : ""}
                <tr class="grand-total">
                  <td><strong>Amount Due</strong></td>
                  <td class="text-right" style="font-weight: 900; font-size: 22px; color: #4f46e5;">₹${inv.amount.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            ${inv.notes ? `
              <div class="notes-card">
                <div style="font-weight: bold; text-transform: uppercase; font-size: 9px; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">Terms & Conditions Notes</div>
                <div style="line-height: 1.5; color: #334155;">${inv.notes}</div>
              </div>
            ` : ""}

            <div class="footer">
              Generated and cryptographically compiled by BillNest Multi-Tenant SaaS Ledger.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF generated for ${inv.id}`, "success");
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === "all" ||
        inv.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Invoice Command Center</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Draft, duplicate, audit, and issue isolated tenant PDF statements seamlessly.
          </p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl gap-1 shadow-sm shrink-0">
          <button
            onClick={() => setCurrentSubTab("all")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              currentSubTab === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={handleInitCreateTab}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              currentSubTab === "editor" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_box</span>
            {editingInvoiceId ? "Edit Draft" : "Create Invoice"}
          </button>
        </div>
      </div>

      {/* ==================== SUBTAB: ALL INVOICES ==================== */}
      {currentSubTab === "all" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          
          {/* Filters Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-50">
            <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Active Workspace Registry</h4>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search Invoice ID / Client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts Only</option>
                <option value="sent">Sent Only</option>
                <option value="paid">Paid Only</option>
                <option value="overdue">Overdue Only</option>
                <option value="void">Void Only</option>
              </select>
            </div>
          </div>

          {/* Table-based or Grid invoices summary */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-left text-xs font-semibold text-slate-600">
              <thead className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4">Invoice ID</th>
                  <th className="p-3">Client Entity</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Ledger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => {
                    const isDraft = inv.status?.toLowerCase() === "draft";
                    const isSent = inv.status?.toLowerCase() === "sent";
                    const isOverdue = inv.status?.toLowerCase() === "overdue";
                    const isPaid = inv.status?.toLowerCase() === "paid";
                    const isVoid = inv.status?.toLowerCase() === "void";

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-4 font-black text-slate-900">{inv.id}</td>
                        <td className="p-3 text-slate-700 font-bold">{inv.client}</td>
                        <td className="p-3 text-slate-500 font-medium">{inv.date || "Today"}</td>
                        <td className="p-3 text-slate-500 font-medium">{inv.dueDate}</td>
                        <td className="p-3 font-black text-slate-950">{formatCurrency(inv.amount)}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : isSent
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : isVoid
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Action: Edit Draft */}
                            {isDraft && (
                              <button
                                onClick={() => handleLoadEditDraft(inv)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 px-2 py-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer text-[10px] font-bold"
                                title="Edit Draft details"
                              >
                                Edit
                              </button>
                            )}

                            {/* Action: Send */}
                            {isDraft && (
                              <button
                                onClick={() => handleSendInvoice(inv.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                                title="Send invoice to client email"
                              >
                                Send
                              </button>
                            )}

                            {/* Action: Mark Paid */}
                            {(isSent || isOverdue) && (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                                title="Record client payment clearance"
                              >
                                Mark Paid
                              </button>
                            )}

                            {/* Action: Void */}
                            {(isSent || isOverdue) && (
                              <button
                                onClick={() => handleVoidInvoice(inv.id)}
                                className="bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer text-[10px] font-bold"
                                title="Void invoice balance"
                              >
                                Void
                              </button>
                            )}

                            {/* Action: Duplicate */}
                            <button
                              onClick={() => handleDuplicateInvoice(inv)}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-950 p-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                              title="Duplicate invoice template"
                            >
                              <span className="material-symbols-outlined text-[13px] font-bold p-0.5">content_copy</span>
                            </button>

                            {/* Action: PDF */}
                            <button
                              onClick={() => handleCustomGeneratePDF(inv)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                              title="Download professional PDF statement"
                            >
                              <span className="material-symbols-outlined text-[13px] font-bold p-0.5">picture_as_pdf</span>
                            </button>

                            {/* Action: Delete */}
                            {isDraft && (
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                                title="Delete Draft"
                              >
                                <span className="material-symbols-outlined text-[13px] font-bold p-0.5">delete</span>
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">No workspace invoices matched search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==================== SUBTAB: EDITOR (CREATE & EDIT) ==================== */}
      {currentSubTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form input details */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">
                  {editingInvoiceId ? `Modify Invoice Draft: ${editingInvoiceId}` : "Draft New Invoicing Document"}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Add line details, tax codes, and currency structures.</p>
              </div>
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black px-2.5 py-0.5 rounded-lg select-none uppercase tracking-wider">
                {editingInvoiceId ? "Draft Mode Edit" : "Fresh Statement Creator"}
              </span>
            </div>

            <form onSubmit={(e) => handleSaveEditor(e, "draft")} className="space-y-5 text-xs font-semibold">
              
              {/* Fields: Number, Client, DueDate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Number</label>
                  <input
                    type="text"
                    required
                    placeholder="INV-XXXX"
                    value={editorInvNumber}
                    onChange={(e) => setEditorInvNumber(e.target.value)}
                    disabled={!!editingInvoiceId}
                    className="w-full bg-slate-50 disabled:opacity-75 disabled:cursor-not-allowed border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Client Entity</label>
                  <select
                    value={editorClient}
                    onChange={(e) => setEditorClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={editorDueDate}
                    onChange={(e) => setEditorDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-100 grid grid-cols-12 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  <span className="col-span-6">Service Description</span>
                  <span className="col-span-2 text-center">Hours / Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Actions</span>
                </div>

                <div className="divide-y divide-slate-50">
                  {editorItems.length > 0 ? (
                    editorItems.map((item, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-12 text-xs font-semibold text-slate-700 items-center hover:bg-slate-50/20">
                        <span className="col-span-6 text-slate-900 font-bold truncate pr-3">{item.desc}</span>
                        <span className="col-span-2 text-center text-slate-500">{item.qty}</span>
                        <span className="col-span-2 text-right text-slate-500">₹{item.price.toLocaleString()}</span>
                        <span className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditorDeleteItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors"
                            title="Remove item row"
                          >
                            <span className="material-symbols-outlined text-[15px] font-bold">close</span>
                          </button>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 italic">No line items added. Complete input fields below.</div>
                  )}
                </div>

                {/* Add Line Item Inputs */}
                <div className="p-3 bg-slate-50/30 border-t border-slate-100 flex flex-col gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Add Item details</span>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Service details rendered..."
                      className="col-span-6 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-semibold"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-xs text-center outline-none focus:border-indigo-500 font-semibold"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      min="0"
                      className="col-span-4 bg-white border border-slate-200 rounded-lg p-2 text-xs text-right outline-none focus:border-indigo-500 font-semibold"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleEditorAddItem}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-black transition-colors w-fit outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] font-bold">add_circle</span>
                    Append Line Item
                  </button>
                </div>
              </div>

              {/* Tax, Discount, Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                      value={editorDiscount}
                      onChange={(e) => setEditorDiscount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Tax Code (GST %)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                      value={editorTaxRate}
                      onChange={(e) => setEditorTaxRate(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Notes / Terms & Conditions</label>
                  <textarea
                    rows="2"
                    placeholder="Provide payment directions or project guidelines..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none transition-colors resize-none"
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentSubTab("all")}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Cancel Edit
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveEditor(e, "sent")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer outline-none flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px] font-bold">telegram</span>
                  Save & Send
                </button>
              </div>

            </form>
          </div>

          {/* Right Panel (4 columns): Live Editor Summary Card */}
          <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-2xl flex flex-col justify-between max-h-[500px]">
            <div className="space-y-4">
              <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">LIVE INVOICE SUMMARY</span>
              
              <div className="py-2 border-b border-slate-800 flex justify-between text-xs font-medium text-slate-300">
                <span>Client Workspace</span>
                <span className="font-bold text-white truncate max-w-[150px]">{editorClient || "No Client"}</span>
              </div>

              <div className="py-2 border-b border-slate-800 flex justify-between text-xs font-medium text-slate-300">
                <span>Items Subtotal</span>
                <span className="font-bold text-white">₹{editorSubtotal.toLocaleString()}</span>
              </div>

              {editorDiscount > 0 && (
                <div className="py-2 border-b border-slate-800 flex justify-between text-xs font-medium text-rose-400">
                  <span>Discount deduction ({editorDiscount}%)</span>
                  <span>- ₹{editorDiscountAmount.toLocaleString()}</span>
                </div>
              )}

              {editorTaxRate > 0 && (
                <div className="py-2 border-b border-slate-800 flex justify-between text-xs font-medium text-slate-300">
                  <span>GST registration ({editorTaxRate}%)</span>
                  <span className="font-bold text-white">+ ₹{editorTaxAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="py-3 flex justify-between items-baseline font-black">
                <span className="text-sm text-slate-200">Balanced Total</span>
                <span className="text-2xl text-indigo-400 font-extrabold">₹{editorFinalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 bg-slate-850 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-2.5 text-[10px] text-slate-400 font-semibold leading-relaxed">
              <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5">verified</span>
              <p>
                Dynamic calculations mapped automatically. Confirm details prior to deploying or sending this statement.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default InvoicesTab;
