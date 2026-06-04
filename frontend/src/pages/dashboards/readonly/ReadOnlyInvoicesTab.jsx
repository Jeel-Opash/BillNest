import React, { useState } from "react";
import StripeCheckoutModal from "../../../components/StripeCheckoutModal";

const ReadOnlyInvoicesTab = ({
  invoices = [],
  setInvoices,
  payments = [],
  setPayments,
  user,
  showToast
}) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("classic");

  // Stripe Modal states
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const getTemplateStyles = (theme) => {
    switch (theme) {
      case "midnight":
        return `
          body { font-family: 'Outfit', 'Inter', sans-serif; color: #f1f5f9; padding: 40px; margin: 0; background-color: #0f172a; }
          .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #334155; border-radius: 24px; bg: #1e293b; background: radial-gradient(circle at top right, #1e293b, #0f172a); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header-row { display: flex; justify-content: space-between; border-bottom: 2px solid #818cf8; padding-bottom: 24px; margin-bottom: 30px; align-items: center; }
          .company-name { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
          .invoice-title { font-size: 34px; font-weight: 900; color: #818cf8; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
          .metadata-row { display: flex; justify-content: space-between; margin-bottom: 35px; font-size: 13px; color: #cbd5e1; }
          .bill-to { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #94a3b8; margin-bottom: 6px; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #1e293b; border-bottom: 2px solid #475569; padding: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; text-align: left; }
          .table td { padding: 14px 12px; border-bottom: 1px solid #334155; font-size: 13px; color: #e2e8f0; }
          .text-right { text-align: right !important; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-table { width: 320px; border-collapse: collapse; font-size: 13px; }
          .totals-table td { padding: 9px 12px; color: #cbd5e1; }
          .grand-total { font-size: 20px; font-weight: 950; color: #818cf8; border-top: 2px solid #475569; padding-top: 14px !important; }
          .notes-card { margin-top: 40px; padding: 20px; background-color: #1e293b; border-radius: 16px; font-size: 12px; border-left: 4px solid #818cf8; color: #94a3b8; }
          .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; font-weight: bold; }
        `;
      case "sunset":
        return `
          body { font-family: 'Outfit', 'Inter', sans-serif; color: #2d3748; padding: 40px; margin: 0; background-color: #fffaf0; }
          .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #fbd38d; border-radius: 20px; background: #ffffff; box-shadow: 0 10px 25px rgba(221,107,32,0.05); }
          .header-row { display: flex; justify-content: space-between; border-bottom: 4px solid #ed8936; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
          .company-name { font-size: 26px; font-weight: 900; color: #2c5282; }
          .invoice-title { font-size: 32px; font-weight: 900; color: #dd6b20; text-align: right; text-transform: uppercase; }
          .metadata-row { display: flex; justify-content: space-between; margin-bottom: 35px; font-size: 13px; }
          .bill-to { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #718096; margin-bottom: 6px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #feebc8; border-bottom: 2px solid #fbd38d; padding: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #c05621; text-align: left; }
          .table td { padding: 14px 12px; border-bottom: 1px solid #edf2f7; font-size: 13px; }
          .text-right { text-align: right !important; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-table { width: 320px; border-collapse: collapse; font-size: 13px; }
          .totals-table td { padding: 9px 12px; }
          .grand-total { font-size: 20px; font-weight: 900; color: #dd6b20; border-top: 2px solid #fbd38d; padding-top: 14px !important; }
          .notes-card { margin-top: 40px; padding: 16px; background-color: #fffaf0; border-radius: 12px; font-size: 12px; border-left: 4px solid #ed8936; }
          .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: bold; }
        `;
      case "minimalist":
        return `
          body { font-family: 'Inter', sans-serif; color: #1a202c; padding: 50px; margin: 0; background: #ffffff; }
          .invoice-box { max-width: 800px; margin: auto; padding: 10px; }
          .header-row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; align-items: flex-end; }
          .company-name { font-size: 22px; font-weight: bold; color: #000000; }
          .invoice-title { font-size: 24px; font-weight: 300; color: #718096; text-align: right; text-transform: uppercase; }
          .metadata-row { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 12px; color: #4a5568; }
          .bill-to { font-weight: bold; text-transform: uppercase; font-size: 9px; color: #a0aec0; margin-bottom: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .table th { border-bottom: 1px solid #1a202c; padding: 10px 6px; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #1a202c; text-align: left; }
          .table td { padding: 12px 6px; border-bottom: 1px solid #edf2f7; font-size: 12px; }
          .text-right { text-align: right !important; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-table { width: 280px; border-collapse: collapse; font-size: 12px; }
          .totals-table td { padding: 8px 6px; }
          .grand-total { font-size: 16px; font-weight: bold; color: #000000; border-top: 1px solid #1a202c; padding-top: 12px !important; }
          .notes-card { margin-top: 50px; font-size: 11px; color: #718096; line-height: 1.5; }
          .footer { margin-top: 80px; font-size: 9px; text-align: center; color: #cbd5e0; border-top: 1px solid #edf2f7; padding-top: 20px; }
        `;
      case "classic":
      default:
        return `
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
        `;
    }
  };

  const downloadPrintHtml = (inv) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Allow popups to render the statement.", "error");
      return;
    }

    const items = inv.items || inv.itemsList || [{ desc: "Workspace services", qty: 1, price: inv.amount }];
    const disc = inv.discount || 0;
    const rate = inv.taxRate || 18;
    const sub = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const discAmount = Math.round(sub * (disc / 100));
    const tax = Math.round((sub - discAmount) * (rate / 100));

    const styles = getTemplateStyles(activeTemplate);

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            ${styles}
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-row">
              <div>
                <div class="company-name">${user?.organization?.name || "CodeCraft Agency"}</div>
                <div style="font-size: 11px; margin-top: 4px; font-weight: bold; opacity: 0.8;">CRYPTOGRAPHICALLY SECURED WORKSPACE LEDGER</div>
              </div>
              <div class="invoice-title">INVOICE</div>
            </div>

            <div class="metadata-row">
              <div>
                <div class="bill-to">Bill To:</div>
                <div style="font-weight: 800; font-size: 16px;">${inv.client}</div>
                <div style="margin-top: 4px; line-height: 1.4; opacity: 0.8;">Client Target Entity</div>
              </div>
              <div style="text-align: right; line-height: 1.7; font-size: 13px;">
                <div><strong>Invoice Reference:</strong> ${inv.id}</div>
                <div><strong>Issue Date:</strong> ${inv.date}</div>
                <div><strong>Payment Due:</strong> ${inv.dueDate}</div>
                <div><strong>Status:</strong> <span style="text-transform: uppercase; font-size: 10px; font-weight: 900;">${inv.status}</span></div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right" style="width: 80px;">Qty</th>
                  <th class="text-right" style="width: 120px;">Unit Price</th>
                  <th class="text-right" style="width: 120px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td><strong>${item.desc}</strong></td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">₹${item.price.toLocaleString()}</td>
                    <td class="text-right">₹${(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td>Subtotal</td>
                  <td class="text-right">₹${sub.toLocaleString()}</td>
                </tr>
                ${disc > 0 ? `
                  <tr style="color: #dc2626; font-weight: bold;">
                    <td>Discount (${disc}%)</td>
                    <td class="text-right">- ₹${discAmount.toLocaleString()}</td>
                  </tr>
                ` : ""}
                ${tax > 0 ? `
                  <tr>
                    <td>Tax (GST ${rate}%)</td>
                    <td class="text-right">+ ₹${tax.toLocaleString()}</td>
                  </tr>
                ` : ""}
                <tr class="grand-total">
                  <td><strong>Amount Due</strong></td>
                  <td class="text-right"><strong>₹${inv.amount.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            ${inv.notes ? `
              <div class="notes-card">
                <div style="font-weight: bold; text-transform: uppercase; font-size: 9px; margin-bottom: 4px; letter-spacing: 0.5px;">Terms & Conditions Notes</div>
                <div style="line-height: 1.5;">${inv.notes}</div>
              </div>
            ` : ""}

            <div class="footer">
              Generated and cryptographically compiled by BillNest Multi-Tenant SaaS Ledger.
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF Statement exported using theme ${activeTemplate.toUpperCase()}!`, "success");
  };

  const handleOpenCheckout = (inv) => {
    setSelectedInvoiceForPay(inv);
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = (txn) => {
    // 1. Update invoice status to PAID
    setInvoices(prev => prev.map(inv => inv.id === txn.invoice ? { ...inv, status: "paid" } : inv));
    
    // 2. Add payment record
    const newPayment = {
      id: txn.txnId,
      invoice: txn.invoice,
      client: txn.client,
      method: txn.method,
      amount: txn.amount,
      status: "succeeded",
      date: txn.date
    };
    setPayments(prev => [newPayment, ...prev]);

    // 3. Add to Stripe webhook event logs
    try {
      const email = user?.email || "guest";
      const existingLogs = JSON.parse(localStorage.getItem(`workspace_${email}_stripe_logs`) || "[]");
      const newLog = {
        id: `evt_${Math.random().toString(36).substring(2, 18)}`,
        type: "payment_intent.succeeded",
        created: new Date().toISOString(),
        livemode: false,
        api_version: "2023-10-16",
        data: {
          object: {
            id: txn.txnId.replace("TXN", "pi"),
            amount: txn.amount * 100, // in cents
            currency: "inr",
            payment_method_types: ["card"],
            status: "succeeded",
            charges: {
              data: [
                {
                  id: txn.txnId.replace("TXN", "ch"),
                  receipt_url: "https://stripe.com/receipt/ch_simulation",
                  billing_details: { email: email, name: txn.client }
                }
              ]
            }
          }
        }
      };
      localStorage.setItem(`workspace_${email}_stripe_logs`, JSON.stringify([newLog, ...existingLogs]));
      // Notify other tabs
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
    }

    showToast(`Invoice ${txn.invoice} paid successfully via Stripe Checkout simulation!`, "success");
  };

  const handlePaymentFailure = (err) => {
    // Log failure event
    try {
      const email = user?.email || "guest";
      const existingLogs = JSON.parse(localStorage.getItem(`workspace_${email}_stripe_logs`) || "[]");
      const newLog = {
        id: `evt_${Math.random().toString(36).substring(2, 18)}`,
        type: "payment_intent.payment_failed",
        created: new Date().toISOString(),
        livemode: false,
        api_version: "2023-10-16",
        data: {
          object: {
            id: `pi_${Math.random().toString(36).substring(2, 10)}`,
            amount: err.amount * 100,
            currency: "inr",
            last_payment_error: {
              code: err.code,
              decline_code: err.decline_code,
              message: err.message
            },
            status: "requires_payment_method"
          }
        }
      };
      localStorage.setItem(`workspace_${email}_stripe_logs`, JSON.stringify([newLog, ...existingLogs]));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error(e);
    }
    showToast(`Payment attempt declined: ${err.message}`, "error");
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
            Your observer credentials grant full read access to invoice history, line items, and print systems. Generating new billing records, editing parameters, voiding, or deleting ledger items is restricted. However, you can simulate a client-side Stripe Checkout to clear active sent balances.
          </p>
        </div>
      </div>

      {/* Templates Customization row */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
        <div>
          <h4 className="font-heading text-sm font-black uppercase tracking-wider text-indigo-300">Premium Statement Templates Studio</h4>
          <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed font-semibold">
            Choose a visual design blueprint. Printed PDFs/Exports will render in real time using the active theme.
          </p>
        </div>

        <div className="flex bg-slate-800/80 border border-slate-700 p-1 rounded-xl gap-1">
          {[
            { id: "classic", label: "Classic Navy" },
            { id: "midnight", label: "Midnight Luxe" },
            { id: "sunset", label: "Vibrant Sunset" },
            { id: "minimalist", label: "Minimal Clean" }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => setActiveTemplate(theme.id)}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTemplate === theme.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-700/50" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {theme.label}
            </button>
          ))}
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
            filteredInvoices.map(inv => {
              const isSent = inv.status === "sent" || inv.status === "overdue";
              return (
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
                    
                    <div className="flex gap-1.5 select-none w-full sm:w-auto justify-end">
                      <button
                        onClick={() => downloadPrintHtml(inv)}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] px-3 py-1.5 rounded-lg font-black uppercase transition-all cursor-pointer shadow-sm"
                      >
                        Print PDF Theme
                      </button>
                      
                      {isSent ? (
                        <button
                          onClick={() => handleOpenCheckout(inv)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-3.5 py-1.5 rounded-lg font-black uppercase transition-all cursor-pointer shadow-sm shadow-indigo-100 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">credit_card</span>
                          Pay (Stripe Sim)
                        </button>
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg bg-slate-100 border border-transparent text-slate-400 flex items-center justify-center cursor-not-allowed"
                          title="Editing or voiding invoices is restricted"
                        >
                          <span className="material-symbols-outlined text-[15px]">lock</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stripe checkout dialog component rendering */}
      <StripeCheckoutModal
        invoice={selectedInvoiceForPay}
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedInvoiceForPay(null);
        }}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />

    </div>
  );
};

export default ReadOnlyInvoicesTab;
