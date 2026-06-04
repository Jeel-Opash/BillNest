import React, { useState, useMemo } from "react";
import StripeCheckoutModal from "../../../components/StripeCheckoutModal";

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
  payments = [],
  setPayments,
  showToast
}) => {
  const [activeTemplate, setActiveTemplate] = useState("classic");
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Statement PDF Builder & Previewer Modal State
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewCompanyName, setPreviewCompanyName] = useState("BillNest SaaS Platform");
  const [previewLogoUrl, setPreviewLogoUrl] = useState("");
  const [previewFooter, setPreviewFooter] = useState("Generated and cryptographically compiled by BillNest Multi-Tenant SaaS Ledger.");
  const [previewShowTax, setPreviewShowTax] = useState(true);
  const [previewShowNotes, setPreviewShowNotes] = useState(true);
  const [previewCurrency, setPreviewCurrency] = useState("INR");
  const [previewScale, setPreviewScale] = useState(0.9);

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


  const getTemplateStyles = (theme) => {
    switch (theme) {
      case "midnight":
        return `
          body { font-family: 'Outfit', 'Inter', sans-serif; color: #f1f5f9; padding: 40px; margin: 0; background-color: #0f172a; }
          .invoice-box { max-width: 800px; margin: auto; padding: 35px; border: 1px solid #334155; border-radius: 24px; background: radial-gradient(circle at top right, #1e293b, #0f172a); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
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

  const handleCustomGeneratePDF = (
    inv,
    theme = activeTemplate,
    companyName = previewCompanyName,
    logoUrl = previewLogoUrl,
    footer = previewFooter,
    showTax = previewShowTax,
    showNotes = previewShowNotes,
    currency = previewCurrency
  ) => {
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
    const taxVal = showTax ? Math.round((subtotal - discountVal) * (taxPct / 100)) : 0;
    const finalAmount = Math.max(0, subtotal - discountVal + taxVal);

    const styles = getTemplateStyles(theme);
    const currencySym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹";

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.id} - ${inv.client}</title>
          <style>
            ${styles}
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-row">
              <div>
                ${logoUrl ? `<img src="${logoUrl}" style="max-height: 48px; border-radius: 8px; margin-bottom: 8px; display: block;" />` : ""}
                <div class="company-name">${companyName}</div>
                <div style="font-size: 11px; margin-top: 4px; font-weight: bold; opacity: 0.8;">CRYPTOGRAPHICALLY SECURED WORKSPACE LEDGER</div>
              </div>
              <div class="invoice-title">INVOICE</div>
            </div>

            <div class="metadata-row">
              <div>
                <div class="bill-to">Bill To:</div>
                <div style="font-weight: 800; font-size: 16px;">${inv.client}</div>
                ${matchedClient ? `<div style="margin-top: 4px; line-height: 1.4; opacity: 0.8;">GSTIN/Tax ID: ${matchedClient.taxId || "Unregistered"}<br/>Address: ${matchedClient.address || "Local Entity"}</div>` : '<div style="margin-top: 4px; opacity: 0.8;">Isolated Client Entity</div>'}
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
                  <th class="text-right" style="width: 120px;">Rate</th>
                  <th class="text-right" style="width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${inv.items?.map(item => `
                  <tr>
                    <td><strong>${item.desc}</strong></td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">${currencySym}${item.price.toLocaleString()}</td>
                    <td class="text-right">${currencySym}${(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                `).join("") || `<tr><td colspan="4">Service fee standard</td></tr>`}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td>Subtotal</td>
                  <td class="text-right">${currencySym}${subtotal.toLocaleString()}</td>
                </tr>
                ${discountVal > 0 ? `
                  <tr style="color: #dc2626; font-weight: bold;">
                    <td>Discount (${discPct}%)</td>
                    <td class="text-right">- ${currencySym}${discountVal.toLocaleString()}</td>
                  </tr>
                ` : ""}
                ${taxVal > 0 ? `
                  <tr>
                    <td>Tax (${taxPct}%)</td>
                    <td class="text-right">+ ${currencySym}${taxVal.toLocaleString()}</td>
                  </tr>
                ` : ""}
                <tr class="grand-total">
                  <td><strong>Amount Due</strong></td>
                  <td class="text-right"><strong>${currencySym}${finalAmount.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            ${(showNotes && inv.notes) ? `
              <div class="notes-card">
                <div style="font-weight: bold; text-transform: uppercase; font-size: 9px; margin-bottom: 4px; letter-spacing: 0.5px;">Terms & Conditions Notes</div>
                <div style="line-height: 1.5;">${inv.notes}</div>
              </div>
            ` : ""}

            <div class="footer">
              ${footer}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF Statement exported using theme ${theme.toUpperCase()}!`, "success");
  };

  const handleOpenPreview = (inv) => {
    setSelectedInvoiceForPreview(inv);
    setPreviewCompanyName("BillNest SaaS Platform");
    setPreviewLogoUrl("");
    setPreviewFooter("Generated and cryptographically compiled by BillNest Multi-Tenant SaaS Ledger.");
    setPreviewShowTax(true);
    setPreviewShowNotes(true);
    setPreviewCurrency(inv.currency || "INR");
    setPreviewScale(0.9);
    setIsPreviewModalOpen(true);
  };

  const handleOpenCheckout = (inv) => {
    setSelectedInvoiceForPay(inv);
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = (txn) => {
    setInvoices(prev => prev.map(inv => inv.id === txn.invoice ? { ...inv, status: "paid" } : inv));
    
    const newPayment = {
      id: txn.txnId,
      invoice: txn.invoice,
      client: txn.client,
      method: txn.method,
      amount: txn.amount,
      status: "succeeded",
      date: txn.date
    };
    if (setPayments) {
      setPayments(prev => [newPayment, ...prev]);
    }

    try {
      const email = "owner@codecraft.com";
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
            amount: txn.amount * 100,
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
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
    }

    showToast(`Invoice ${txn.invoice} paid via Stripe Checkout simulation!`, "success");
  };

  const handlePaymentFailure = (err) => {
    try {
      const email = "owner@codecraft.com";
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
    showToast(`Payment declined: ${err.message}`, "error");
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

      {/* Templates Customization row */}
      {currentSubTab === "all" && (
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
      )}

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
                              <>
                                <button
                                  onClick={() => handleMarkPaid(inv.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                                  title="Record client payment clearance"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleOpenCheckout(inv)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
                                  title="Simulate client Stripe checkout payment flow"
                                >
                                  <span className="material-symbols-outlined text-[10px] font-black">credit_card</span>
                                  Pay (Stripe Sim)
                                </button>
                              </>
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
                              onClick={() => handleOpenPreview(inv)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                              title="Design & export professional PDF statement"
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
      {/* Stripe checkout simulation overlay */}
      {isPayModalOpen && selectedInvoiceForPay && (
        <StripeCheckoutModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedInvoiceForPay(null);
          }}
          invoice={selectedInvoiceForPay}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      {/* Premium Statement PDF Builder & Previewer Modal */}
      {isPreviewModalOpen && selectedInvoiceForPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-fade-in text-slate-100">
            
            {/* Left Options Column (1/3 width) */}
            <div className="w-full md:w-[360px] bg-slate-950/50 border-r border-slate-800/80 p-6 flex flex-col justify-between overflow-y-auto select-none gap-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight text-white font-heading">Statement Designer</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customizer Sandbox</p>
                  </div>
                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    PRO v1.5
                  </span>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-300">
                  {/* Theme Switcher */}
                  <div>
                    <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2">Select Theme Template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "classic", label: "Classic Navy" },
                        { id: "midnight", label: "Midnight Luxe" },
                        { id: "sunset", label: "Vibrant Sunset" },
                        { id: "minimalist", label: "Minimal Clean" }
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setActiveTemplate(theme.id)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer border ${
                            activeTemplate === theme.id 
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10" 
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company Branding Input */}
                  <div>
                    <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1.5">Company Brand Name</label>
                    <input
                      type="text"
                      value={previewCompanyName}
                      onChange={(e) => setPreviewCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs outline-none text-white font-semibold transition-colors"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>

                  {/* Logo URL Input */}
                  <div>
                    <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1.5">Workspace Logo URL</label>
                    <input
                      type="text"
                      value={previewLogoUrl}
                      onChange={(e) => setPreviewLogoUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs outline-none text-white font-semibold transition-colors"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  {/* Currency Picker */}
                  <div>
                    <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1.5">Base Currency Override</label>
                    <select
                      value={previewCurrency}
                      onChange={(e) => setPreviewCurrency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs outline-none text-white font-bold cursor-pointer"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  {/* Footer message */}
                  <div>
                    <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1.5">Custom Footer Message</label>
                    <textarea
                      rows="2"
                      value={previewFooter}
                      onChange={(e) => setPreviewFooter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-600 rounded-xl px-3 py-1.5 text-xs outline-none text-white font-semibold transition-colors resize-none"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={previewShowTax}
                        onChange={(e) => setPreviewShowTax(e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 bg-slate-900 focus:ring-indigo-600"
                      />
                      <span className="text-[11px] font-bold">Include Tax Computation</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={previewShowNotes}
                        onChange={(e) => setPreviewShowNotes(e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 bg-slate-900 focus:ring-indigo-600"
                      />
                      <span className="text-[11px] font-bold">Include Terms & Notes</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* PDF Print Actions */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewScale(prev => Math.max(0.6, prev - 0.05))}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-black uppercase cursor-pointer"
                  >
                    Zoom Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(prev => Math.min(1.2, prev + 0.05))}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-black uppercase cursor-pointer"
                  >
                    Zoom In
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCustomGeneratePDF(
                    selectedInvoiceForPreview,
                    activeTemplate,
                    previewCompanyName,
                    previewLogoUrl,
                    previewFooter,
                    previewShowTax,
                    previewShowNotes,
                    previewCurrency
                  )}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">print</span>
                  Print & Export PDF
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setSelectedInvoiceForPreview(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Close Designer
                </button>
              </div>
            </div>

            {/* Right Live Preview Canvas */}
            <div className="flex-1 bg-slate-950 p-8 overflow-auto flex items-start justify-center relative">
              <div 
                className="transition-transform duration-200 shadow-2xl origin-top"
                style={{ transform: `scale(${previewScale})` }}
              >
                {/* Visual rendering matching the printed templates in real-time */}
                {(() => {
                  const inv = selectedInvoiceForPreview;
                  const matchedClient = clients.find(c => c.company === inv.client);
                  const subtotal = inv.items?.reduce((acc, it) => acc + (it.qty * it.price), 0) || inv.amount;
                  const discPct = inv.discount || 0;
                  const discountVal = Math.round(subtotal * (discPct / 100));
                  const taxPct = inv.taxRate || 18;
                  const taxVal = previewShowTax ? Math.round((subtotal - discountVal) * (taxPct / 100)) : 0;
                  const finalAmount = Math.max(0, subtotal - discountVal + taxVal);
                  const currencySym = previewCurrency === "USD" ? "$" : previewCurrency === "EUR" ? "€" : "₹";

                  // Dynamic theme classes
                  let boxClass = "";
                  let thClass = "";
                  let tdClass = "";
                  let accentTextClass = "";
                  let labelClass = "";
                  let notesClass = "";
                  let headerBorderClass = "";

                  if (activeTemplate === "midnight") {
                    boxClass = "bg-slate-900 border border-slate-800 text-slate-100 p-8 rounded-3xl max-w-[700px] w-[700px] min-h-[850px] flex flex-col justify-between";
                    thClass = "bg-slate-850 text-slate-400 font-bold uppercase text-[9px] p-3 text-left border-b border-slate-800";
                    tdClass = "p-3.5 border-b border-slate-800/60 text-xs text-slate-300";
                    accentTextClass = "text-indigo-400";
                    labelClass = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1";
                    notesClass = "mt-8 p-4 bg-slate-855 rounded-2xl border-l-4 border-indigo-500 text-slate-400 text-xs";
                    headerBorderClass = "border-b-2 border-indigo-500 pb-5 mb-6";
                  } else if (activeTemplate === "sunset") {
                    boxClass = "bg-amber-50/10 border border-amber-900/20 text-slate-900 p-8 rounded-[20px] max-w-[700px] w-[700px] min-h-[850px] flex flex-col justify-between bg-white";
                    thClass = "bg-amber-50 text-amber-900/80 font-bold uppercase text-[9px] p-3 text-left border-b border-amber-200/50";
                    tdClass = "p-3.5 border-b border-slate-100 text-xs text-slate-700";
                    accentTextClass = "text-orange-600";
                    labelClass = "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1";
                    notesClass = "mt-8 p-4 bg-amber-50/30 rounded-xl border-l-4 border-orange-500 text-slate-600 text-xs";
                    headerBorderClass = "border-b-4 border-orange-500 pb-4 mb-6";
                  } else if (activeTemplate === "minimalist") {
                    boxClass = "bg-white text-slate-900 p-8 max-w-[700px] w-[700px] min-h-[850px] flex flex-col justify-between border border-slate-200";
                    thClass = "border-b border-slate-900 text-slate-900 font-bold uppercase text-[9px] p-3 text-left";
                    tdClass = "p-3 border-b border-slate-100 text-xs text-slate-800";
                    accentTextClass = "text-slate-950 font-black";
                    labelClass = "text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1";
                    notesClass = "mt-8 text-slate-500 text-xs line-height-relaxed";
                    headerBorderClass = "border-b border-slate-200 pb-5 mb-8";
                  } else {
                    // Classic Navy
                    boxClass = "bg-white text-slate-800 p-8 rounded-2xl max-w-[700px] w-[700px] min-h-[850px] flex flex-col justify-between border border-slate-200 shadow-sm";
                    thClass = "bg-slate-50 text-slate-500 font-bold uppercase text-[9px] p-3 text-left border-b border-slate-200";
                    tdClass = "p-3.5 border-b border-slate-100 text-xs text-slate-700";
                    accentTextClass = "text-indigo-600";
                    labelClass = "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1";
                    notesClass = "mt-8 p-4 bg-slate-50 rounded-xl border-l-4 border-indigo-600 text-slate-600 text-xs";
                    headerBorderClass = "border-b-2 border-indigo-600 pb-4 mb-6";
                  }

                  return (
                    <div className={boxClass}>
                      <div>
                        {/* Header Row */}
                        <div className={`flex justify-between items-center ${headerBorderClass}`}>
                          <div>
                            {previewLogoUrl ? (
                              <img src={previewLogoUrl} alt="Logo" className="max-h-10 rounded-lg mb-2 block" />
                            ) : null}
                            <div className="text-lg font-black tracking-tight text-slate-900">{previewCompanyName}</div>
                            <div className="text-[9px] text-slate-400 font-black tracking-widest uppercase mt-0.5">Cryptographic Workspace Ledger</div>
                          </div>
                          <div className={`text-2xl font-black tracking-wider uppercase ${accentTextClass}`}>Invoice</div>
                        </div>

                        {/* Metadata Row */}
                        <div className="grid grid-cols-2 gap-4 mb-8 text-xs">
                          <div>
                            <div className={labelClass}>Bill To:</div>
                            <div className="font-extrabold text-slate-900 text-sm">{inv.client}</div>
                            {matchedClient ? (
                              <div className="mt-1 text-slate-500 font-medium leading-relaxed">
                                GSTIN: {matchedClient.taxId || "Unregistered"}<br />
                                Address: {matchedClient.address || "Local Entity"}
                              </div>
                            ) : (
                              <div className="mt-1 text-slate-400 italic">Isolated Client Entity</div>
                            )}
                          </div>
                          <div className="text-right text-slate-500 space-y-1 font-medium">
                            <div><strong>Reference:</strong> <span className="font-extrabold text-slate-900">{inv.id}</span></div>
                            <div><strong>Issue Date:</strong> {inv.date}</div>
                            <div><strong>Due Date:</strong> {inv.dueDate}</div>
                            <div><strong>Status:</strong> <span className={`uppercase font-black text-[9px] tracking-wider px-1.5 py-0.5 rounded ${
                              inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            }`}>{inv.status}</span></div>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="w-full">
                          <div className="grid grid-cols-12 select-none">
                            <span className={`${thClass} col-span-6`}>Description</span>
                            <span className={`${thClass} col-span-2 text-center`}>Qty</span>
                            <span className={`${thClass} col-span-2 text-right`}>Rate</span>
                            <span className={`${thClass} col-span-2 text-right`}>Total</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {inv.items?.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 items-center">
                                <span className={`${tdClass} col-span-6 font-bold text-slate-900`}>{item.desc}</span>
                                <span className={`${tdClass} col-span-2 text-center font-medium`}>{item.qty}</span>
                                <span className={`${tdClass} col-span-2 text-right font-medium`}>{currencySym}{item.price.toLocaleString()}</span>
                                <span className={`${tdClass} col-span-2 text-right font-extrabold text-slate-900`}>{currencySym}{(item.qty * item.price).toLocaleString()}</span>
                              </div>
                            )) || (
                              <div className="p-4 text-center text-slate-400 italic text-xs">Standard flat rate billing.</div>
                            )}
                          </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end mt-6">
                          <div className="w-72 space-y-2.5 text-xs font-semibold text-slate-600">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="text-slate-900 font-extrabold">{currencySym}{subtotal.toLocaleString()}</span>
                            </div>
                            {discountVal > 0 && (
                              <div className="flex justify-between text-rose-600">
                                <span>Discount ({discPct}%)</span>
                                <span>- {currencySym}{discountVal.toLocaleString()}</span>
                              </div>
                            )}
                            {taxVal > 0 && (
                              <div className="flex justify-between">
                                <span>Tax ({taxPct}%)</span>
                                <span className="text-slate-900 font-extrabold">+ {currencySym}{taxVal.toLocaleString()}</span>
                              </div>
                            )}
                            <div className={`flex justify-between pt-3 border-t border-slate-200 text-sm font-black ${accentTextClass}`}>
                              <span>Amount Due</span>
                              <span className="text-base font-extrabold">{currencySym}{finalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {previewShowNotes && inv.notes ? (
                          <div className={notesClass}>
                            <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-1 select-none">Terms & Conditions / Bank Instructions</div>
                            <div>{inv.notes}</div>
                          </div>
                        ) : null}
                      </div>

                      {/* Footer Message */}
                      <div className="mt-12 pt-4 border-t border-slate-100 text-center text-[9px] font-bold text-slate-400 tracking-wider">
                        {previewFooter}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InvoicesTab;
