import React, { useState, useMemo } from "react";
import StripeCheckoutModal from "../../../components/StripeCheckoutModal";
import axios from "axios";

/* ─── currency formatter ─────────────────────────────────────── */
const fmt = (val, currency = "INR") =>
  new Intl.NumberFormat(
    currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN",
    { style: "currency", currency, maximumFractionDigits: 0 }
  ).format(val);

/* ─── status badge styles ────────────────────────────────────── */
const STATUS_STYLE = {
  draft:   "bg-slate-100 text-slate-600 border-slate-200",
  sent:    "bg-blue-50 text-blue-700 border-blue-100",
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  overdue: "bg-rose-50 text-rose-700 border-rose-100",
  void:    "bg-amber-50 text-amber-700 border-amber-100",
};

/**
 * Role permission matrix
 *
 * owner    full control
 * admin    same as owner (org-settings managed elsewhere)
 * member   create draft, edit draft, send, mark paid, pay via stripe — NO void / NO delete
 * readonly view + pdf + pay via stripe — NO write ops
 */
const ROLE_PERMS = {
  owner:    { canCreate: true,  canEdit: true,  canSend: true,  canMarkPaid: true,  canVoid: true,  canDelete: true,  canDuplicate: true,  canPay: true  },
  admin:    { canCreate: true,  canEdit: true,  canSend: true,  canMarkPaid: true,  canVoid: true,  canDelete: true,  canDuplicate: true,  canPay: true  },
  member:   { canCreate: true,  canEdit: true,  canSend: true,  canMarkPaid: true,  canVoid: false, canDelete: false, canDuplicate: true,  canPay: true  },
  readonly: { canCreate: false, canEdit: false, canSend: false, canMarkPaid: false, canVoid: false, canDelete: false, canDuplicate: false, canPay: true  },
};

const EMPTY_FORM = {
  number:   "",
  client:   "",
  dueDate:  new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  discount: 0,
  taxRate:  18,
  notes:    "",
  items:    [],
};

/* ─── component ─────────────────────────────────────────────── */
const InvoiceTab = ({
  role = "member",
  invoices = [],
  setInvoices,
  clients = [],
  payments = [],
  setPayments,
  showToast,
  user,
}) => {
  const perms = ROLE_PERMS[role] ?? ROLE_PERMS.readonly;

  const getClientRole = (clientNameOrId) => {
    if (!user) return "none";
    if (user.role === "owner") return "admin";
    const clientAccessList = user.clientAccess || [];
    if (user.role === "admin" && clientAccessList.length === 0) return "admin";
    
    const client = clients.find(c => c.company === clientNameOrId || c.name === clientNameOrId || c.id === clientNameOrId || c._id === clientNameOrId);
    const clientId = client?.id || client?._id || clientNameOrId;
    const access = clientAccessList.find(a => a.clientId === clientId || a.clientName === clientNameOrId);
    
    return access ? access.role : "none";
  };

  const getPermissions = (clientNameOrId) => {
    const globalRole = user?.role || role || "readonly";
    
    if (globalRole === "owner") {
      return ROLE_PERMS.owner;
    }
    if (globalRole === "readonly") {
      return ROLE_PERMS.readonly;
    }
    
    const clientRole = getClientRole(clientNameOrId);
    
    if (globalRole === "admin") {
      if (clientRole === "none" || clientRole === "viewer") {
        return ROLE_PERMS.readonly;
      }
      return ROLE_PERMS.admin;
    }
    
    if (globalRole === "member") {
      if (clientRole === "none" || clientRole === "viewer") {
        return ROLE_PERMS.readonly;
      }
      if (clientRole === "admin") {
        return {
          canCreate: true,
          canEdit: true,
          canSend: true,
          canMarkPaid: true,
          canVoid: false,
          canDelete: false,
          canDuplicate: true,
          canPay: true
        };
      }
      // clientRole === "member"
      return {
        canCreate: true,
        canEdit: true,
        canSend: false,
        canMarkPaid: false,
        canVoid: false,
        canDelete: false,
        canDuplicate: true,
        canPay: true
      };
    }
    
    return ROLE_PERMS.readonly;
  };

  /* list state */
  const [view, setView]               = useState("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]           = useState("");

  /* form state */
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty]   = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  /* stripe modal */
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);

  /* email modal */
  const [emailModalInvoice, setEmailModalInvoice] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const openEmailModal = (inv) => {
    const clientObj = clients.find(c => c.company === inv.client || c.name === inv.client);
    setRecipientEmail(clientObj?.email || "");
    setEmailModalInvoice(inv);
  };

  const handleSendEmailSubmit = async () => {
    if (!recipientEmail) {
      showToast("Please enter a recipient email address.", "warning");
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const clientObj = clients.find(c => c.company === emailModalInvoice.client || c.name === emailModalInvoice.client) || {};
      
      const payload = {
        invoice: {
          id: emailModalInvoice.id,
          invoiceNumber: emailModalInvoice.id || emailModalInvoice.invoiceNumber,
          dueDate: emailModalInvoice.dueDate,
          items: emailModalInvoice.items || [],
          subtotal: emailModalInvoice.amount ? Math.round(emailModalInvoice.amount / (1 + (emailModalInvoice.taxRate || 18)/100)) : 0,
          tax: emailModalInvoice.amount ? Math.round(emailModalInvoice.amount - (emailModalInvoice.amount / (1 + (emailModalInvoice.taxRate || 18)/100))) : 0,
          total: emailModalInvoice.amount,
          currency: clientObj.currency || "INR",
        },
        client: {
          name: clientObj.name || clientObj.company || "Valued Client",
          email: clientObj.email || recipientEmail,
          company: clientObj.company || "",
          address: clientObj.address || "",
        },
        recipientEmail: recipientEmail,
      };

      const res = await axios.post("/api/invoices/send-email-direct", payload);
      if (res.data.success) {
        showToast(`Invoice successfully emailed to ${recipientEmail}!`, "success");
      } else {
        showToast(res.data.message || "Failed to send email.", "error");
      }
    } catch (error) {
      console.error("Failed to email invoice:", error);
      const errMsg = error.response?.data?.message || "Failed to send email due to a network or server error.";
      showToast(errMsg, "error");
    } finally {
      setIsSendingEmail(false);
      setEmailModalInvoice(null);
      setRecipientEmail("");
    }
  };

  /* ── financials ─────────────────────────────────────────────── */
  const subtotal    = useMemo(() => form.items.reduce((s, i) => s + i.qty * i.price, 0), [form.items]);
  const discountAmt = useMemo(() => Math.round(subtotal * (form.discount / 100)), [subtotal, form.discount]);
  const taxAmt      = useMemo(() => Math.round((subtotal - discountAmt) * (form.taxRate / 100)), [subtotal, discountAmt, form.taxRate]);
  const total       = useMemo(() => Math.max(0, subtotal - discountAmt + taxAmt), [subtotal, discountAmt, taxAmt]);

  /* ── filtered list ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(inv =>
      (inv.id?.toLowerCase().includes(q) || inv.client?.toLowerCase().includes(q)) &&
      (statusFilter === "all" || inv.status === statusFilter)
    );
  }, [invoices, search, statusFilter]);

  /* ── summary stats ──────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:       invoices.length,
    paid:        invoices.filter(i => i.status === "paid").length,
    overdue:     invoices.filter(i => i.status === "overdue").length,
    outstanding: invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0),
  }), [invoices]);

  /* ── form helpers ───────────────────────────────────────────── */
  const openCreate = () => {
    const allowedClients = clients.filter(c => getClientRole(c.id || c._id || c.company) !== "none");
    setForm({ ...EMPTY_FORM, number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, client: allowedClients[0]?.company || allowedClients[0]?.name || "" });
    setEditId(null);
    setView("create");
  };

  const openEdit = (inv) => {
    if (inv.status !== "draft") { showToast("Only Draft invoices can be edited.", "error"); return; }
    setForm({ number: inv.id, client: inv.client, dueDate: inv.dueDate, discount: inv.discount || 0, taxRate: inv.taxRate || 18, notes: inv.notes || "", items: inv.items || [] });
    setEditId(inv.id);
    setView("edit");
  };

  const addItem = () => {
    if (!itemDesc.trim() || itemPrice <= 0) { showToast("Enter description and price.", "warning"); return; }
    setForm(f => ({ ...f, items: [...f.items, { desc: itemDesc.trim(), qty: itemQty, price: itemPrice }] }));
    setItemDesc(""); setItemQty(1); setItemPrice(0);
  };

  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const saveInvoice = (e, targetStatus = "draft") => {
    e.preventDefault();
    if (!form.items.length) { showToast("Add at least one line item.", "error"); return; }
    const saved = {
      id: form.number, client: form.client, amount: total,
      date: new Date().toISOString().split("T")[0],
      dueDate: form.dueDate, status: targetStatus,
      items: form.items, discount: form.discount, taxRate: form.taxRate, notes: form.notes,
    };
    if (editId) {
      setInvoices(invoices.map(i => i.id === editId ? saved : i));
      showToast(`Invoice ${editId} updated.`, "success");
    } else {
      if (invoices.some(i => i.id === saved.id)) saved.id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      setInvoices([saved, ...invoices]);
      showToast(`Invoice ${saved.id} created.`, "success");
    }
    setView("list"); setEditId(null);
  };

  /* ── state transitions ──────────────────────────────────────── */
  const sendInvoice = (id) => {
    setInvoices(invoices.map(i => i.id === id ? { ...i, status: "sent" } : i));
    showToast(`Invoice ${id} sent.`, "success");
  };

  const markPaid = (id) => {
    setInvoices(invoices.map(i => i.id === id ? { ...i, status: "paid" } : i));
    showToast(`Invoice ${id} marked paid.`, "success");
  };

  const voidInvoice = (id) => {
    if (!window.confirm(`Void invoice ${id}? This cannot be undone.`)) return;
    setInvoices(invoices.map(i => i.id === id ? { ...i, status: "void" } : i));
    showToast(`Invoice ${id} voided.`, "info");
  };

  const deleteDraft = (id) => {
    if (!window.confirm(`Delete draft ${id}?`)) return;
    setInvoices(invoices.filter(i => i.id !== id));
    showToast(`Draft ${id} deleted.`, "info");
  };

  const duplicateInv = (inv) => {
    const id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoices([{ ...inv, id, date: new Date().toISOString().split("T")[0], status: "draft" }, ...invoices]);
    showToast(`Duplicated → ${id}`, "success");
  };

  /* ── PDF export ─────────────────────────────────────────────── */
  const exportPDF = (inv) => {
    const win = window.open("", "_blank");
    if (!win) { showToast("Allow pop-ups to export PDF.", "error"); return; }
    const items = inv.items || [];
    const sub  = items.reduce((s, i) => s + i.qty * i.price, 0);
    const disc = Math.round(sub * ((inv.discount || 0) / 100));
    const tax  = Math.round((sub - disc) * ((inv.taxRate || 18) / 100));
    win.document.write(`<html><head><title>${inv.id}</title><style>
      body{font-family:Inter,sans-serif;padding:40px;color:#1e293b}
      .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:24px}
      .brand{font-size:22px;font-weight:900;color:#4f46e5}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#f8fafc;padding:10px;font-size:10px;font-weight:800;text-transform:uppercase;color:#64748b;text-align:left;border-bottom:2px solid #e2e8f0}
      td{padding:10px;border-bottom:1px solid #f1f5f9;font-size:12px}
      .tr{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}
      .grand{font-size:16px;font-weight:900;color:#4f46e5;border-top:2px solid #e2e8f0;padding-top:10px}
      .footer{text-align:center;margin-top:50px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
    </style></head><body>
      <div class="hdr"><div class="brand">BillNest</div><div style="font-size:28px;font-weight:900">INVOICE</div></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px">
        <div><strong>Bill To:</strong><br/>${inv.client}</div>
        <div style="text-align:right">
          <div><strong>${inv.id}</strong></div>
          <div>Issued: ${inv.date}</div><div>Due: ${inv.dueDate}</div>
          <div style="text-transform:uppercase;font-weight:800;color:#4f46e5">${inv.status}</div>
        </div>
      </div>
      <table><thead><tr>
        <th>Description</th><th>Qty</th>
        <th style="text-align:right">Rate</th><th style="text-align:right">Total</th>
      </tr></thead><tbody>
        ${items.map(i => `<tr>
          <td>${i.desc}</td><td>${i.qty}</td>
          <td style="text-align:right">₹${i.price.toLocaleString()}</td>
          <td style="text-align:right">₹${(i.qty * i.price).toLocaleString()}</td>
        </tr>`).join("")}
      </tbody></table>
      <div style="width:280px;margin-left:auto">
        <div class="tr"><span>Subtotal</span><span>₹${sub.toLocaleString()}</span></div>
        ${disc > 0 ? `<div class="tr" style="color:#dc2626"><span>Discount (${inv.discount}%)</span><span>-₹${disc.toLocaleString()}</span></div>` : ""}
        ${tax  > 0 ? `<div class="tr" style="color:#059669"><span>GST (${inv.taxRate}%)</span><span>+₹${tax.toLocaleString()}</span></div>` : ""}
        <div class="tr grand"><span>Amount Due</span><span>₹${inv.amount.toLocaleString()}</span></div>
      </div>
      ${inv.notes ? `<div style="margin-top:20px;padding:12px;background:#f8fafc;border-left:3px solid #4f46e5;font-size:11px;border-radius:6px">${inv.notes}</div>` : ""}
      <div class="footer">BillNest · Secure Invoice · Role: ${role.toUpperCase()}</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    win.document.close();
    showToast(`PDF exported for ${inv.id}.`, "success");
  };

  /* ── payment handlers ───────────────────────────────────────── */
  const openPayment = (inv) => {
    const clientObj = clients.find(c => c.company === inv.client || c.name === inv.client);
    setCheckoutInvoice({
      id:          inv.id,
      amount:      inv.amount,
      client:      inv.client,
      clientEmail: clientObj?.email || "",
      items:       inv.items || [],
    });
  };

  const handlePaymentSuccess = (txn) => {
    // 1. Transition invoice → paid
    setInvoices(prev => prev.map(i => i.id === txn.invoice ? { ...i, status: "paid" } : i));

    // 2. Record transaction in shared payments store
    const newTxn = {
      id:      txn.txnId,
      invoice: txn.invoice,
      client:  txn.client,
      method:  txn.method,
      amount:  txn.amount,
      status:  "succeeded",
      date:    txn.date,
    };
    if (setPayments) {
      setPayments(prev => [newTxn, ...prev]);
      try {
        const orgKey = user?.organization?.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "guest";
        const existing = JSON.parse(localStorage.getItem(`workspace_shared_payments_${orgKey}`) || "[]");
        localStorage.setItem(`workspace_shared_payments_${orgKey}`, JSON.stringify([newTxn, ...existing]));
      } catch (_) {}
    }

    showToast(`Payment of ${fmt(txn.amount)} received for ${txn.invoice}!`, "success");
    setCheckoutInvoice(null);
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
            {role === "readonly" ? "Invoice Viewer" : "Invoices"}
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            {role === "owner"    && "Full lifecycle control · Owner"}
            {role === "admin"    && "Create, send, void & mark paid · Admin"}
            {role === "member"   && "Draft, send & log payments · Member"}
            {role === "readonly" && "View & PDF export only · Observer"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view !== "list" && (
            <button onClick={() => { setView("list"); setEditId(null); }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
              ← Back
            </button>
          )}
          {view === "list" && perms.canCreate && (
            <button onClick={openCreate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Invoice
            </button>
          )}
        </div>
      </div>

      {/* ── Role permission notice ──────────────────────────────── */}
      {(role === "member" || role === "readonly") && (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl text-xs font-semibold border ${
          role === "readonly"
            ? "bg-slate-50 border-slate-200 text-slate-600"
            : "bg-indigo-50 border-indigo-100 text-indigo-700"
        }`}>
          <span className="material-symbols-outlined text-[18px] mt-0.5">
            {role === "readonly" ? "lock" : "info"}
          </span>
          <span>
            {role === "readonly"
              ? "Observer mode — view all invoices, export PDFs, and pay outstanding invoices via Stripe. No write operations allowed."
              : "Member mode — create drafts, send them, and log payments. Voiding and deleting are restricted to Admin / Owner."}
          </span>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────── */}
      {view === "list" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",       value: stats.total,                color: "text-slate-900"   },
            { label: "Paid",        value: stats.paid,                 color: "text-emerald-600" },
            { label: "Overdue",     value: stats.overdue,              color: "text-rose-600"    },
            { label: "Outstanding", value: fmt(stats.outstanding),     color: "text-amber-600"   },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          LIST VIEW
      ══════════════════════════════════════════════════════════ */}
      {view === "list" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-4 border-b border-slate-50">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
              <input type="text" placeholder="Search invoice or client…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 w-56" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["all","draft","sent","paid","overdue","void"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border cursor-pointer transition-colors ${
                    statusFilter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Billing state machine guide */}
          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none pb-1">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">Draft</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600">Sent</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">Paid ✓</span>
            <span className="ml-1 text-slate-300">|</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-500">Overdue (auto)</span>
            {perms.canVoid && (
              <>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">Void</span>
              </>
            )}
          </div>

          {/* Table */}
          {/* Table (Desktop View) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs font-semibold text-slate-600">
              <thead className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4 text-left">Invoice</th>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Issue Date</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 italic">No invoices found.</td>
                  </tr>
                ) : filtered.map(inv => {
                  const s = inv.status;
                  const clientCurrency = clients.find(c => c.company === inv.client || c.name === inv.client)?.currency || "INR";
                  const invPerms = getPermissions(inv.client);
                  const canPay = invPerms.canPay && (s === "sent" || s === "overdue");

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 pl-4 font-black text-slate-900">{inv.id}</td>
                      <td className="p-3 font-bold text-slate-700">{inv.client}</td>
                      <td className="p-3 text-slate-500">{inv.date || "—"}</td>
                      <td className="p-3 text-slate-500">{inv.dueDate}</td>
                      <td className="p-3 text-right font-black text-slate-900">{fmt(inv.amount, clientCurrency)}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_STYLE[s] || STATUS_STYLE.draft}`}>
                          {s}
                        </span>
                      </td>
                      <td className="p-3 pr-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">

                          {/* DRAFT — edit / send / delete */}
                          {s === "draft" && invPerms.canEdit && (
                            <button onClick={() => openEdit(inv)}
                              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-bold cursor-pointer transition-colors">
                              Edit
                            </button>
                          )}
                          {s === "draft" && invPerms.canSend && (
                            <button onClick={() => sendInvoice(inv.id)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer transition-colors">
                              Send
                            </button>
                          )}
                          {s === "draft" && invPerms.canDelete && (
                            <button onClick={() => deleteDraft(inv.id)}
                              className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete draft">
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          )}

                          {/* SENT / OVERDUE — mark paid / void */}
                          {(s === "sent" || s === "overdue") && invPerms.canMarkPaid && (
                            <button onClick={() => markPaid(inv.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition-colors">
                              Mark Paid
                            </button>
                          )}
                          {(s === "sent" || s === "overdue") && invPerms.canVoid && (
                            <button onClick={() => voidInvoice(inv.id)}
                              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-bold cursor-pointer transition-colors">
                              Void
                            </button>
                          )}

                          {/* PAY via Stripe — sent/overdue, all roles that canPay */}
                          {canPay && (
                            <button onClick={() => openPayment(inv)}
                              className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              title="Pay via Stripe">
                              <span className="material-symbols-outlined text-[13px]">credit_card</span>
                              Pay
                            </button>
                          )}

                          {/* Duplicate (canCreate roles) */}
                          {invPerms.canDuplicate && (
                            <button onClick={() => duplicateInv(inv)}
                              className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Duplicate">
                              <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            </button>
                          )}

                          {/* PDF — all roles */}
                          <button onClick={() => exportPDF(inv)}
                            className="p-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-colors"
                            title="Export PDF">
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                          </button>

                          {/* Email — all roles except readonly */}
                          {role !== "readonly" && (
                            <button onClick={() => openEmailModal(inv)}
                              className="p-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-colors"
                              title="Email Invoice">
                              <span className="material-symbols-outlined text-[14px]">mail</span>
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (Mobile View) */}
          <div className="block md:hidden space-y-4">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-450 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 font-bold">
                No invoices found.
              </div>
            ) : (
              filtered.map(inv => {
                const s = inv.status;
                const clientCurrency = clients.find(c => c.company === inv.client || c.name === inv.client)?.currency || "INR";
                const invPerms = getPermissions(inv.client);
                const canPay = invPerms.canPay && (s === "sent" || s === "overdue");

                return (
                  <div key={inv.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_15px_rgba(15,23,42,0.015)] space-y-4 hover:border-indigo-100 transition-colors">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className="font-heading text-sm font-black text-slate-900">{inv.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${STATUS_STYLE[s] || STATUS_STYLE.draft}`}>
                        {s}
                      </span>
                    </div>

                    {/* Meta Fields */}
                    <div className="space-y-2 text-xs font-bold text-slate-500">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Client Partner</span>
                        <span className="text-slate-800">{inv.client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issue Date</span>
                        <span className="text-slate-800 font-semibold">{inv.date || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Due Date</span>
                        <span className="text-slate-800 font-semibold">{inv.dueDate}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-50">
                        <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Total Amount</span>
                        <span className="text-slate-950 font-black text-sm">{fmt(inv.amount, clientCurrency)}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-50 justify-end">
                      {s === "draft" && invPerms.canEdit && (
                        <button onClick={() => openEdit(inv)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors">
                          Edit
                        </button>
                      )}
                      {s === "draft" && invPerms.canSend && (
                        <button onClick={() => sendInvoice(inv.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors">
                          Send
                        </button>
                      )}
                      {s === "draft" && invPerms.canDelete && (
                        <button onClick={() => deleteDraft(inv.id)}
                          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete draft">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      )}

                      {(s === "sent" || s === "overdue") && invPerms.canMarkPaid && (
                        <button onClick={() => markPaid(inv.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors">
                          Mark Paid
                        </button>
                      )}
                      {(s === "sent" || s === "overdue") && invPerms.canVoid && (
                        <button onClick={() => voidInvoice(inv.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors">
                          Void
                        </button>
                      )}

                      {canPay && (
                        <button onClick={() => openPayment(inv)}
                          className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">credit_card</span>
                          Pay
                        </button>
                      )}

                      {invPerms.canDuplicate && (
                        <button onClick={() => duplicateInv(inv)}
                          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Duplicate">
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      )}

                      <button onClick={() => exportPDF(inv)}
                        className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-colors"
                        title="Export PDF">
                        <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                      </button>

                      {role !== "readonly" && (
                        <button onClick={() => openEmailModal(inv)}
                          className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-colors"
                          title="Email Invoice">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CREATE / EDIT FORM
      ══════════════════════════════════════════════════════════ */}
      {(view === "create" || view === "edit") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h4 className="font-heading text-base font-bold text-slate-900 mb-5">
              {view === "edit" ? `Editing Draft: ${editId}` : "New Invoice"}
            </h4>

            <form onSubmit={e => saveInvoice(e, "draft")} className="space-y-5 text-xs font-semibold">

              {/* Invoice no / Client / Due date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice No.</label>
                  <input type="text" required value={form.number} disabled={!!editId}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none transition-colors disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</label>
                  <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none cursor-pointer">
                    {clients.filter(c => getClientRole(c.id || c._id || c.company) !== "none").map(c => (
                      <option key={c.id || c._id} value={c.company || c.name}>{c.company || c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
                  <input type="date" required value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none cursor-pointer" />
                </div>
              </div>

              {/* Line items */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 grid grid-cols-12 text-[9px] font-black uppercase text-slate-400 tracking-wider p-3 border-b border-slate-100">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>

                {form.items.length === 0
                  ? <div className="p-4 text-center text-slate-400 italic">No items yet — add below.</div>
                  : form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center p-3 border-b border-slate-50 hover:bg-slate-50/40">
                      <span className="col-span-6 font-bold text-slate-800 truncate pr-2">{item.desc}</span>
                      <span className="col-span-2 text-center text-slate-500">{item.qty}</span>
                      <span className="col-span-2 text-right text-slate-500">₹{item.price.toLocaleString()}</span>
                      <span className="col-span-2 text-right">
                        <button type="button" onClick={() => removeItem(idx)}
                          className="text-slate-300 hover:text-rose-500 cursor-pointer transition-colors">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </span>
                    </div>
                  ))
                }

                {/* Add item row */}
                <div className="p-3 bg-slate-50/40 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <input type="text" placeholder="Description" value={itemDesc}
                      onChange={e => setItemDesc(e.target.value)}
                      className="col-span-6 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-400" />
                    <input type="number" min={1} value={itemQty}
                      onChange={e => setItemQty(parseInt(e.target.value) || 1)}
                      className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-xs text-center outline-none focus:border-indigo-400" />
                    <input type="number" min={0} value={itemPrice} placeholder="Rate"
                      onChange={e => setItemPrice(parseInt(e.target.value) || 0)}
                      className="col-span-4 bg-white border border-slate-200 rounded-lg p-2 text-xs text-right outline-none focus:border-indigo-400" />
                  </div>
                  <button type="button" onClick={addItem}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-black flex items-center gap-1 cursor-pointer">
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>Add Item
                  </button>
                </div>
              </div>

              {/* Discount / Tax / Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount (%)</label>
                  <input type="number" min={0} max={100} value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST (%)</label>
                  <input type="number" min={0} max={100} value={form.taxRate}
                    onChange={e => setForm(f => ({ ...f, taxRate: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
                  <input type="text" placeholder="Payment terms…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs outline-none" />
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setView("list"); setEditId(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors">
                  Save Draft
                </button>
                {view === "create" && getPermissions(form.client).canSend && (
                  <button type="button"
                    onClick={() => {
                      if (!form.items.length) { showToast("Add at least one line item.", "error"); return; }
                      const id = invoices.some(i => i.id === form.number)
                        ? `INV-${Math.floor(1000 + Math.random() * 9000)}`
                        : form.number;
                      const saved = {
                        id, client: form.client, amount: total,
                        date: new Date().toISOString().split("T")[0],
                        dueDate: form.dueDate, status: "sent",
                        items: form.items, discount: form.discount,
                        taxRate: form.taxRate, notes: form.notes,
                      };
                      setInvoices([saved, ...invoices]);
                      showToast(`Invoice ${saved.id} created & sent.`, "success");
                      setView("list");
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors">
                    Create & Send
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Live summary panel */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Summary</span>
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Client</span>
                <span className="font-bold truncate max-w-[140px]">{form.client || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Items</span>
                <span>{form.items.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between border-b border-slate-800 pb-2 text-rose-400">
                  <span>Discount ({form.discount}%)</span>
                  <span>−₹{discountAmt.toLocaleString()}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between border-b border-slate-800 pb-2 text-emerald-400">
                  <span>GST ({form.taxRate}%)</span>
                  <span>+₹{taxAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 font-black text-lg">
                <span className="text-sm text-white">Total</span>
                <span className="text-indigo-400">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Role capability card */}
            <div className="mt-auto p-3 bg-slate-800 rounded-2xl text-[10px] font-semibold space-y-1.5">
              <p className="flex items-center gap-1.5 text-slate-300">
                <span className="material-symbols-outlined text-[13px] text-indigo-400">shield</span>
                Role: <span className="text-white uppercase font-black ml-1">{user?.role || role}</span>
              </p>
              <p className="text-slate-400">Client role: <span className="text-white font-bold capitalize">{getClientRole(form.client)}</span></p>
              {getPermissions(form.client).canSend ? (
                <p className="text-emerald-400">✓ Can create & send invoices</p>
              ) : (
                <p className="text-amber-400">⚠ Draft-only (sending restricted)</p>
              )}
              {getPermissions(form.client).canVoid    ? <p className="text-emerald-400">✓ Can void invoices</p> : <p className="text-rose-400">✕ Void — Restricted</p>}
              {getPermissions(form.client).canDelete  ? <p className="text-emerald-400">✓ Can delete drafts</p> : <p className="text-rose-400">✕ Delete — Restricted</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Stripe Checkout Modal ────────────────────────────────── */}
      {checkoutInvoice && (
        <StripeCheckoutModal
          isOpen={true}
          invoice={checkoutInvoice}
          onClose={() => setCheckoutInvoice(null)}
          onSuccess={handlePaymentSuccess}
          onFailure={() => {
            showToast("Payment failed or was declined.", "error");
            setCheckoutInvoice(null);
          }}
        />
      )}

      {/* ── Custom Email Modal ────────────────────────────────── */}
      {emailModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 flex flex-col gap-4 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-slate-900">Email Invoice</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Send PDF to custom address</p>
                </div>
              </div>
              <button 
                onClick={() => { setEmailModalInvoice(null); setRecipientEmail(""); }}
                className="text-slate-400 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span className="font-bold text-slate-900">{emailModalInvoice.id || emailModalInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Partner:</span>
                  <span className="font-bold text-slate-900">{emailModalInvoice.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="font-black text-slate-950">
                    {fmt(emailModalInvoice.amount || emailModalInvoice.total, clients.find(c => c.company === emailModalInvoice.client || c.name === emailModalInvoice.client)?.currency || "INR")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient Gmail / Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">alternate_email</span>
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter Gmail / email address..."
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
              <button 
                type="button" 
                disabled={isSendingEmail}
                onClick={() => { setEmailModalInvoice(null); setRecipientEmail(""); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isSendingEmail || !recipientEmail}
                onClick={handleSendEmailSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    Send Email
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTab;
