import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import OverviewTab from "./owner/OverviewTab";
import ClientsTab from "./owner/ClientsTab";
import InvoicesTab from "./owner/InvoicesTab";
import TeamTab from "./owner/TeamTab";
import CreateWorkspaceTab from "./owner/CreateWorkspaceTab";
import SubscriptionsTab from "./owner/SubscriptionsTab";
import PaymentsTab from "./owner/PaymentsTab";
import ReportsTab from "./owner/ReportsTab";
import SettingsTab from "./owner/SettingsTab";
import IntegrationsTab from "./owner/IntegrationsTab";
import NotificationsTab from "./owner/NotificationsTab";
import AuditLogsTab from "./owner/AuditLogsTab";

const OwnerDashboard = () => {
  const { user, logout, showToast, addLocalInvitation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const safeSaveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Local storage write failed for key "${key}":`, error);
      if (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED") {
        showToast("Local storage full! Please clear browser cache/storage or remove large images.", "warning");
      }
    }
  };


  const getActivePageFromPath = () => {
    const parts = location.pathname.split("/");
    return parts[2] || "dashboard";
  };

  const activePage = getActivePageFromPath();

  const handlePageChange = (page) => {
    if (page === "dashboard") {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${page}`);
    }
  };

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleExportCSV = () => {
    const headers = ["Invoice ID", "Client", "Amount (INR)", "Date", "Due Date", "Status"];
    const rows = invoices.map(inv => [
      inv.id,
      inv.client,
      inv.amount,
      inv.date,
      inv.dueDate,
      inv.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billnest_invoices_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report downloaded successfully!", "success");
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocker is enabled. Please allow pop-ups to export.", "error");
      return;
    }
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidRevenue = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
    const taxPaid = paidRevenue * 0.18;

    printWindow.document.write(`
      <html>
        <head>
          <title>Tax Statement - CodeCraft Agency</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #4f46e5; }
            .meta { font-size: 14px; color: #64748b; margin-top: 5px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card-title { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .card-value { font-size: 22px; font-weight: bold; margin-top: 10px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; font-weight: bold; font-size: 13px; color: #475569; }
            td { font-size: 14px; }
            .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BillNest Tax Statement</div>
            <div class="meta">Organization: \${user?.organization?.name || "CodeCraft Agency"} | Generated: \${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Invoiced Volume</div>
              <div class="card-value">₹\${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Paid Revenue</div>
              <div class="card-value">₹\${paidRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Estimated Tax Liability (18% GST)</div>
              <div class="card-value">₹\${taxPaid.toLocaleString()}</div>
            </div>
          </div>
          
          <h3>Invoices Ledger Summary</h3>
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
              \${invoices.map(inv => \`
                <tr>
                  <td><strong>\${inv.id}</strong></td>
                  <td>\${inv.client}</td>
                  <td>\${inv.date}</td>
                  <td><span style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: \${inv.status === 'paid' ? '#10b981' : '#ef4444'}">\${inv.status}</span></td>
                  <td>₹\${inv.amount.toLocaleString()}</td>
                </tr>
              \`).join("")}
            </tbody>
          </table>
          
          <div class="footer">
            BillNest isolated tenant secure cryptographically signed accounting summary.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast("Tax Statement document generated!", "success");
  };


  const [mrrValue] = useState(125000);
  const [outstandingValue] = useState(20000);
  const [paidValue] = useState(850000);

  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_clients`);
      return saved ? JSON.parse(saved) : [
        { id: "c1", name: "ABC Restaurant", company: "ABC Food & Beverages", email: "owner@abcrestaurant.com", phone: "+91 98765 43210", taxId: "24ABCDE1234F1Z5", address: "Surat, Gujarat", currency: "INR", notes: "Prefers UPI payments" },
        { id: "c2", name: "Pixel Studio", company: "Pixel Creative Labs", email: "finance@pixelstudio.com", phone: "+91 99988 77766", taxId: "27PIXEL7788A1Z9", address: "Mumbai, Maharashtra", currency: "INR", notes: "Monthly billing cycle" }
      ];
    } catch {
      return [];
    }
  });
  const [clientSearch, setClientSearch] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientTaxId, setNewClientTaxId] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientCurrency, setNewClientCurrency] = useState("INR");
  const [newClientNotes, setNewClientNotes] = useState("");


  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_invoices`);
      return saved ? JSON.parse(saved) : [
        { id: "INV-1024", client: "ABC Food & Beverages", amount: 34220, date: "2026-05-28", dueDate: "2026-06-10", status: "sent", items: [{ desc: "Website Design", qty: 1, price: 25000 }, { desc: "Hosting Support", qty: 12, price: 500 }] },
        { id: "INV-1023", client: "Pixel Creative Labs", amount: 15000, date: "2026-05-20", dueDate: "2025-05-30", status: "paid", items: [{ desc: "Logo Design Pro Package", qty: 1, price: 15000 }] }
      ];
    } catch {
      return [];
    }
  });
  const [builderClient, setBuilderClient] = useState("");
  const [builderDueDate, setBuilderDueDate] = useState("2026-06-15");
  const [builderDiscount, setBuilderDiscount] = useState(10);
  const [builderTaxRate, setBuilderTaxRate] = useState(18);
  const [builderItems, setBuilderItems] = useState([
    { desc: "UI Design", qty: 1, price: 15000 },
    { desc: "Frontend Dev", qty: 1, price: 35000 }
  ]);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);


  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_subscriptions`);
      return saved ? JSON.parse(saved) : [
        { id: "s1", name: "Website Maintenance Plan", price: 5000, cycle: "monthly", trialDays: 0, client: "ABC Food & Beverages", status: "active" }
      ];
    } catch {
      return [];
    }
  });

  const [activePostSubId, setActivePostSubId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPublishSubId, setSelectedPublishSubId] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [newPostAttachment, setNewPostAttachment] = useState(null);
  const [subscriptionPosts, setSubscriptionPosts] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_subscription_posts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState(5000);
  const [newPlanCycle, setNewPlanCycle] = useState("monthly");
  const [newPlanTrial, setNewPlanTrial] = useState(0);
  const [newPlanClient, setNewPlanClient] = useState("");
  const [newPlanImage, setNewPlanImage] = useState("");


  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_payments`);
      return saved ? JSON.parse(saved) : [
        { id: "TXN-90241", invoice: "INV-1023", client: "Pixel Creative Labs", method: "Stripe Card", amount: 15000, status: "succeeded", date: "2026-05-20" },
        { id: "TXN-90240", invoice: "INV-1022", client: "Nova Software Inc", method: "Stripe Card", amount: 5000, status: "failed", date: "2026-05-15" }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSaveToLocalStorage(`workspace_${user?.email || "guest"}_payments`, JSON.stringify(payments));
  }, [payments, user]);


  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [teamList, setTeamList] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_team_list`);
      return saved ? JSON.parse(saved) : [
        { id: "t1", name: user?.name || "Workspace Owner", email: user?.email || "", role: "owner", status: "active" }
      ];
    } catch {
      return [];
    }
  });


  const [auditLogs, setAuditLogs] = useState([
    { id: "a1", action: "CLIENT_CREATED", actor: "Rahul Patel (Owner)", details: "Created ABC Restaurant client account", time: "2 hours ago", status: "SUCCESS" },
    { id: "a2", action: "INVOICE_GENERATED", actor: "Priya Sharma (Admin)", details: "Generated invoice INV-1024 for Pixel Studio", time: "4 hours ago", status: "SUCCESS" },
    { id: "a3", action: "CLIENT_GST_UPDATED", actor: "Amit Kumar (Member)", details: "Updated GST number for Pixel Studio details", time: "1 day ago", status: "SUCCESS" },
    { id: "a4", action: "AUTH_FAIL", actor: "Amit Kumar (Member)", details: "Invalid access attempt from non-registered IP: 192.168.1.1", time: "1 day ago", status: "FAILED" },
    { id: "a5", action: "WORKSPACE_SETTINGS_CHANGED", actor: "Rahul Patel (Owner)", details: "Updated global invoice tax rate from 15% to 18%", time: "2 days ago", status: "SUCCESS" }
  ]);



  const [apiKeys, setApiKeys] = useState([
    { id: "k1", label: "Production Key Scoped", key: "bn_live_codecraft_99f2e811bc", createdAt: "2026-05-28" }
  ]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.zapier.com/hooks/catch/12345/abc");


  const [orgSettings, setOrgSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_org_settings`);
      return saved ? JSON.parse(saved) : {
        name: "CodeCraft Agency",
        logo: "",
        address: "Ring Road, Surat, Gujarat",
        gstNumber: "24AAAAA1111A1Z1",
        timezone: "Asia/Kolkata (IST)",
        currency: "INR",
        invoicePrefix: "INV",
        paymentTerms: "Due on Receipt",
        taxRate: 18
      };
    } catch {
      return {
        name: "CodeCraft Agency",
        logo: "",
        address: "Ring Road, Surat, Gujarat",
        gstNumber: "24AAAAA1111A1Z1",
        timezone: "Asia/Kolkata (IST)",
        currency: "INR",
        invoicePrefix: "INV",
        paymentTerms: "Due on Receipt",
        taxRate: 18
      };
    }
  });

  useEffect(() => {
    safeSaveToLocalStorage(`workspace_${user?.email || "guest"}_org_settings`, JSON.stringify(orgSettings));
  }, [orgSettings, user]);


  const [profileName, setProfileName] = useState("Rahul Patel");
  const [profileEmail] = useState("rahul@codecraft.com");
  const [profilePassword, setProfilePassword] = useState("••••••••");
  const [enable2FA, setEnable2FA] = useState(false);


  const [notifications, setNotifications] = useState([
    { id: "n1", text: "ABC Restaurant paid Invoice INV-1023 successfully.", time: "1 hour ago", read: false },
    { id: "n2", text: "Nova Software Inc failed card payment retry scheduled.", time: "1 day ago", read: false },
    { id: "n3", text: "Neha Patel accepted your Team invite credentials.", time: "2 days ago", read: true }
  ]);

  useEffect(() => {
    if (user?.email) {
      safeSaveToLocalStorage(`workspace_${user.email}_clients`, JSON.stringify(clients));
    }
  }, [clients, user]);

  useEffect(() => {
    if (user?.email) {
      safeSaveToLocalStorage(`workspace_${user.email}_invoices`, JSON.stringify(invoices));
    }
  }, [invoices, user]);

  useEffect(() => {
    if (user?.email) {
      safeSaveToLocalStorage(`workspace_${user.email}_subscriptions`, JSON.stringify(subscriptions));
    }
  }, [subscriptions, user]);

  useEffect(() => {
    if (user?.email) {
      safeSaveToLocalStorage(`workspace_${user.email}_subscription_posts`, JSON.stringify(subscriptionPosts));
    }
  }, [subscriptionPosts, user]);

  useEffect(() => {
    if (user?.email) {
      safeSaveToLocalStorage(`workspace_${user.email}_team_list`, JSON.stringify(teamList));
    }
  }, [teamList, user]);

  useEffect(() => {
    const fetchBackendTeammates = async () => {
      try {
        const res = await axios.get("/auth/team/members");
        if (res.data.success && res.data.members) {
          const dbMembers = res.data.members.map(m => ({
            id: m._id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
            role: m.role,
            status: m.status || "active"
          }));

          setTeamList(prev => {
            const merged = [...dbMembers];
            prev.forEach(p => {
              if (p.status === "pending" && !merged.some(m => m.email.toLowerCase() === p.email.toLowerCase())) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load backend team members:", err);
      }
    };
    
    if (user) {
      fetchBackendTeammates();
    }
  }, [user]);

  useEffect(() => {
    if (clients.length > 0) {
      if (!newPlanClient) setNewPlanClient(clients[0].company || clients[0].name);
      if (!builderClient) setBuilderClient(clients[0].company || clients[0].name);
    }
  }, [clients, newPlanClient, builderClient]);


  const itemsSubtotal = builderItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
  const discountAmount = Math.round(itemsSubtotal * (builderDiscount / 100));
  const itemsTaxAmount = Math.round((itemsSubtotal - discountAmount) * (builderTaxRate / 100));
  const itemsFinalTotal = Math.max(0, itemsSubtotal - discountAmount + itemsTaxAmount);


  const handleAddBuilderItem = (e) => {
    e.preventDefault();
    if (!newDesc || newQty <= 0 || newPrice < 0) return;
    setBuilderItems([...builderItems, { desc: newDesc, qty: newQty, price: newPrice }]);
    setNewDesc("");
    setNewQty(1);
    setNewPrice(0);
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!builderItems.length) {
      showToast("Please add at least one line item.", "error");
      return;
    }
    const newInv = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      client: builderClient,
      amount: itemsFinalTotal,
      date: new Date().toISOString().split("T")[0],
      dueDate: builderDueDate,
      status: "draft",
      items: builderItems
    };
    setInvoices([newInv, ...invoices]);
    setBuilderItems([]);
    showToast(`Invoice Draft ${newInv.id} created!`, "success");
    handlePageChange("invoices");
    setTimeout(() => {
      handleGenerateInvoicePDF(newInv);
    }, 100);
  };

  const handleGenerateInvoicePDF = (inv) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocker is enabled. Please allow pop-ups to export.", "error");
      return;
    }
    const invSubtotal = inv.items.reduce((acc, it) => acc + (it.qty * it.price), 0);
    const invDiscount = Math.round(invSubtotal * (builderDiscount / 100));
    const invTax = Math.round((invSubtotal - invDiscount) * (builderTaxRate / 100));
    const invTotal = inv.amount;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.id} - ${inv.client}</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #334155; padding: 40px; margin: 0; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header-row { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; align-items: center; }
            .company-details { text-align: left; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e1b4b; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #4f46e5; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
            .metadata-row { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
            .bill-to { font-weight: bold; color: #1e293b; margin-bottom: 5px; text-transform: uppercase; font-size: 11px; tracking-wider; color: #64748b; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; text-align: left; }
            .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .text-right { text-align: right !important; }
            .totals-section { display: flex; justify-content: flex-end; }
            .totals-table { width: 300px; border-collapse: collapse; font-size: 13px; }
            .totals-table td { padding: 8px 12px; }
            .grand-total { font-size: 18px; font-weight: 800; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 12px !important; }
            .footer { margin-top: 60px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-row">
              <div class="company-details">
                <div class="company-name">${user?.organization?.name || "CodeCraft Agency"}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Premium Tenant Workspace</div>
              </div>
              <div class="invoice-title">INVOICE</div>
            </div>

            <div class="metadata-row">
              <div>
                <div class="bill-to">Bill To:</div>
                <div style="font-weight: bold; font-size: 15px; color: #0f172a;">${inv.client}</div>
                <div style="color: #64748b; margin-top: 2px;">Isolated SaaS Client Entity</div>
              </div>
              <div style="text-align: right; line-height: 1.6;">
                <div><strong>Invoice Number:</strong> ${inv.id}</div>
                <div><strong>Date of Issue:</strong> ${inv.date}</div>
                <div><strong>Due Date:</strong> ${inv.dueDate}</div>
                <div><strong>Payment Status:</strong> <span style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: #3b82f6;">${inv.status}</span></div>
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
                ${inv.items.map(item => `
                  <tr>
                    <td><strong>${item.desc}</strong></td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">₹${item.price.toLocaleString()}</td>
                    <td class="text-right" style="font-weight: bold;">₹${(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td style="color: #64748b;">Subtotal</td>
                  <td class="text-right">₹${invSubtotal.toLocaleString()}</td>
                </tr>
                ${invDiscount > 0 ? `
                  <tr style="color: #dc2626;">
                    <td>Discount (${builderDiscount}%)</td>
                    <td class="text-right">- ₹${invDiscount.toLocaleString()}</td>
                  </tr>
                ` : ""}
                ${invTax > 0 ? `
                  <tr>
                    <td style="color: #64748b;">GST (${builderTaxRate}%)</td>
                    <td class="text-right">+ ₹${invTax.toLocaleString()}</td>
                  </tr>
                ` : ""}
                <tr class="grand-total">
                  <td><strong>Balance Due</strong></td>
                  <td class="text-right" style="font-weight: 800; font-size: 20px; color: #4f46e5;">₹${invTotal.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              Thank you for your business! Generated and digitally signed via BillNest Isolated Billing Engine.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF invoice generated for ${inv.id}!`, "success");
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;
    const newC = {
      id: `c${Date.now()}`,
      name: newClientName,
      company: newClientCompany,
      email: newClientEmail,
      phone: newClientPhone,
      taxId: newClientTaxId,
      address: newClientAddress,
      currency: newClientCurrency,
      notes: newClientNotes
    };
    setClients([...clients, newC]);
    setNewClientName("");
    setNewClientCompany("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientTaxId("");
    setNewClientAddress("");
    setNewClientNotes("");
    showToast(`Client ${newClientName} registered successfully!`, "success");
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlanName || newPlanPrice <= 0) return;
    const newSub = {
      id: `s${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      cycle: newPlanCycle,
      trialDays: newPlanTrial,
      client: newPlanClient,
      imageUrl: newPlanImage,
      status: "active"
    };
    const updated = [...subscriptions, newSub];
    setSubscriptions(updated);
    setNewPlanName("");
    setNewPlanPrice(5000);
    setNewPlanTrial(0);
    setNewPlanImage("");
    showToast(`Subscription '${newPlanName}' deployed!`, "success");
  };

  const handlePublishPost = (subId) => {
    if (!newPostTitle || !newPostContent) {
      showToast("Please enter a title and description.", "error");
      return;
    }
    const newPost = {
      id: `post_${Date.now()}`,
      subscriptionId: subId,
      title: newPostTitle,
      content: newPostContent,
      imageUrl: newPostImage || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
      attachment: newPostAttachment,
      date: new Date().toISOString().split("T")[0]
    };
    const updated = [...subscriptionPosts, newPost];
    setSubscriptionPosts(updated);
    safeSaveToLocalStorage("billnest_subscription_posts", JSON.stringify(updated));
    showToast("Subscription announcement published!", "success");
    setActivePostSubId(null);
    setNewPostTitle("");
    setNewPostContent("");
    setNewPostImage("");
    setNewPostAttachment(null);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newInviteObj = {
      id: `t${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending"
    };
    setTeamList([...teamList, newInviteObj]);
    if (addLocalInvitation) {
      addLocalInvitation(inviteEmail, inviteRole, user?.organization?.name || "CodeCraft Agency");
    }
    setInviteEmail("");
    showToast(`Invite sent to ${inviteEmail}!`, "success");
  };

  const handleCreateApiKey = (e) => {
    e.preventDefault();
    if (!newKeyLabel) return;
    const newK = {
      id: `k${Date.now()}`,
      label: newKeyLabel,
      key: `bn_live_${Math.random().toString(16).substr(2, 13)}`,
      createdAt: new Date().toISOString().split("T")[0]
    };
    setApiKeys([...apiKeys, newK]);
    setNewKeyLabel("");
    showToast(`API Key '${newKeyLabel}' generated.`, "success");
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-700 font-sans antialiased">

      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-5 bg-white border-r border-slate-100 z-50">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            AF
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-heading text-lg font-bold text-slate-900 tracking-tight leading-none">AgencyFlow</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Enterprise Plan</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          {[
            {
              title: "ANALYTICS",
              items: [
                { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
                { id: "reports", label: "Reports & Analytics", symbol: "monitoring" }
              ]
            },
            {
              title: "MANAGEMENT",
              items: [
                { id: "clients", label: "Clients", symbol: "group" },
                { id: "invoices", label: "Invoices", symbol: "receipt_long" },
                { id: "team", label: "Team members", symbol: "badge" },
                { id: "subscriptions", label: "Subscription plans", symbol: "autorenew" },
                { id: "payments", label: "Payments", symbol: "payments" }
              ]
            },
            {
              title: "SYSTEM",
              items: [
                { id: "integrations", label: "Integrations", symbol: "key" },
                { id: "settings", label: "Settings", symbol: "settings" },
                { id: "notifications", label: `Notifications (${notifications.filter(n => !n.read).length})`, symbol: "notifications" },
                { id: "audit", label: "Audit Logs", symbol: "terminal" }
              ]
            }
          ].map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="block text-slate-400 text-[9px] font-bold tracking-widest px-3 mb-1.5 uppercase">{group.title}</span>
              {group.items.map((menu) => {
                const isActive = activePage === menu.id;
                return (
                  <button
                    key={menu.id}
                    onClick={() => handlePageChange(menu.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 text-left ${isActive
                      ? "bg-indigo-50/80 text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                      {menu.symbol}
                    </span>
                    <span>{menu.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => handlePageChange("profile")}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity text-left outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-200/50 shadow-sm flex items-center justify-center font-extrabold text-white text-base select-none flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 text-xs truncate leading-snug">{user?.name || "Jeel Opash"}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Workspace Owner</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="flex items-center">
            <div className="relative border border-slate-200/60 focus-within:border-indigo-500/50 rounded-xl bg-slate-50/50">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                className="pl-9 pr-4 py-1.5 bg-transparent border-none rounded-xl w-64 focus:ring-0 text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none"
                placeholder="Search transactions, clients..."
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center px-3 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-pulse">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{user?.organization?.name || "Active Org Tenant"}</span>
            </div>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6 relative">
              <button onClick={() => handlePageChange("notifications")} className="text-slate-400 hover:text-indigo-600 transition-colors relative">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-indigo-600 rounded-full shadow-sm animate-ping"></span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-xl border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all outline-none flex items-center justify-center"
                >
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs select-none">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2.5 w-56 bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-3 z-50 flex flex-col gap-2.5 animate-fade-in">
                      <div className="px-2 py-1.5 border-b border-slate-50 flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-xs truncate">{user?.name || "Jeel Opash"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email || "rahul@codecraft.com"}</span>
                        <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded w-fit leading-none">
                          Workspace Owner
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            handlePageChange("profile");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          Profile Settings
                        </button>

                        <button
                          onClick={() => {
                            handlePageChange("settings");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">settings</span>
                          Organization Settings
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-50">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                          Sign Out Workspace
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 w-full flex-1 flex flex-col gap-6">

          {activePage === "dashboard" && (
            <OverviewTab
              user={user}
              clients={clients}
              invoices={invoices}
              subscriptions={subscriptions}
              payments={payments}
              teamList={teamList}
              auditLogs={auditLogs}
            />
          )}

          {activePage === "clients" && (
            <ClientsTab
              clients={clients}
              setClients={setClients}
              invoices={invoices}
              newClientName={newClientName}
              setNewClientName={setNewClientName}
              newClientCompany={newClientCompany}
              setNewClientCompany={setNewClientCompany}
              newClientEmail={newClientEmail}
              setNewClientEmail={setNewClientEmail}
              newClientPhone={newClientPhone}
              setNewClientPhone={setNewClientPhone}
              newClientTaxId={newClientTaxId}
              setNewClientTaxId={setNewClientTaxId}
              newClientCurrency={newClientCurrency}
              setNewClientCurrency={setNewClientCurrency}
              newClientAddress={newClientAddress}
              setNewClientAddress={setNewClientAddress}
              handleAddClient={handleAddClient}
              showToast={showToast}
            />
          )}

          {activePage === "invoices" && (
            <InvoicesTab
              clients={clients}
              invoices={invoices}
              setInvoices={setInvoices}
              builderClient={builderClient}
              setBuilderClient={setBuilderClient}
              builderDueDate={builderDueDate}
              setBuilderDueDate={setBuilderDueDate}
              newDesc={newDesc}
              setNewDesc={setNewDesc}
              newQty={newQty}
              setNewQty={setNewQty}
              newPrice={newPrice}
              setNewPrice={setNewPrice}
              builderItems={builderItems}
              builderDiscount={builderDiscount}
              setBuilderDiscount={setBuilderDiscount}
              builderTaxRate={builderTaxRate}
              setBuilderTaxRate={setBuilderTaxRate}
              handleAddBuilderItem={handleAddBuilderItem}
              handleCreateInvoice={handleCreateInvoice}
              handleGenerateInvoicePDF={handleGenerateInvoicePDF}
              showToast={showToast}
            />
          )}

          {activePage === "subscriptions" && (
            <SubscriptionsTab
              user={user}
              clients={clients}
              subscriptions={subscriptions}
              setSubscriptions={setSubscriptions}
              invoices={invoices}
              payments={payments}
              showToast={showToast}
            />
          )}

          {activePage === "payments" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-slate-900">Payments</h3>
                <p className="text-slate-500 text-sm mt-1">Review live financial actions, payout status indicators, and Stripe processor logs.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2 border-b border-slate-50 pb-3">
                  <h4 className="font-heading text-lg font-bold text-slate-900">Stripe Transaction Logs</h4>
                  <button className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Filter logs
                  </button>
                </div>

                <div className="space-y-4">
                  {payments.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200/80 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-950 text-xs">{p.id}</span>
                          <span className="bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold">INV REF: {p.invoice}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Client: <span className="font-semibold text-slate-700">{p.client}</span> | Channel: {p.method} | Date: {p.date}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 w-full sm:w-auto">
                        <h5 className="font-extrabold text-slate-900 text-sm">₹{p.amount.toLocaleString()}</h5>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${p.status === "succeeded"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                          }`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "create-workspace" && (
            <CreateWorkspaceTab />
          )}

          {activePage === "team" && (
            <TeamTab
              teamList={teamList}
              setTeamList={setTeamList}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              handleSendInvite={handleSendInvite}
              showToast={showToast}
            />
          )}

          {activePage === "reports" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-slate-900">Reports</h3>
                <p className="text-slate-500 text-sm mt-1">Simulate organizations financial trajectory, balance reserves, and export tax summaries.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                  <h4 className="font-heading text-lg font-bold text-slate-900">Revenue Projection Curves</h4>

                  <div className="h-64 relative w-full mb-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                      <div className="border-b border-slate-50 w-full h-0"></div>
                      <div className="border-b border-slate-50 w-full h-0"></div>
                      <div className="border-b border-slate-50 w-full h-0"></div>
                    </div>

                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path className="text-emerald-500" d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15 L 400 100 L 0 100 Z" fill="url(#projGradient)" />
                      <circle cx="100" cy="80" r="4" className="fill-white stroke-emerald-500 stroke-[2px]" />
                      <circle cx="200" cy="60" r="4" className="fill-white stroke-emerald-500 stroke-[2px]" />
                      <circle cx="300" cy="45" r="4" className="fill-white stroke-emerald-500 stroke-[2px]" />
                      <circle cx="400" cy="15" r="4" className="fill-emerald-500 stroke-white stroke-[2px]" />
                    </svg>

                    <div className="absolute inset-x-0 bottom-0 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-2">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>June (Proj)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-6">
                  <div>
                    <h4 className="font-heading text-lg font-bold text-slate-900">Export Raw Tenant Logs</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Download complete accounting statements or invoices scoped under your current organization isolated workspace context.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={handleExportCSV} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm outline-none">
                      Export Invoices (.CSV)
                    </button>
                    <button onClick={handleExportPDF} className="w-full bg-indigo-600 border border-transparent text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm outline-none focus:outline-none focus:ring-0">
                      Export Tax Statement (.PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "audit" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-slate-900">Cryptographic Audit Logs</h3>
                  <p className="text-slate-500 text-sm mt-1">Review organizational actions, timestamps, and security compliance registers with immutable ledger verification.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">tune</span>
                    Filters
                  </button>
                  <div className="relative">
                    <select className="bg-white border border-slate-200 text-slate-600 pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer appearance-none">
                      <option>ACTIVE SCOPE: CodeCraft Agency</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">arrow_drop_down</span>
                  </div>
                  <button onClick={() => showToast("Exporting ledger data...", "info")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Export Logs
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-sm">verified_user</span>
                    <h4 className="font-heading text-lg font-bold text-slate-900">Activity Ledger</h4>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    System Online
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="pb-3">Actor</th>
                        <th className="pb-3">Action</th>
                        <th className="pb-3">Details</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-700">
                      {auditLogs.map((log, index) => {
                        const actorInitial = log.actor.charAt(0);
                        const colors = [
                          "bg-indigo-50 border-indigo-100 text-indigo-600",
                          "bg-purple-50 border-purple-100 text-purple-600",
                          "bg-amber-50 border-amber-100 text-amber-600",
                          "bg-rose-50 border-rose-100 text-rose-600",
                          "bg-teal-50 border-teal-100 text-teal-600"
                        ];
                        const randomColor = colors[index % colors.length];

                        let actionClass = "bg-slate-100 text-slate-700 border-slate-200/50";
                        if (log.action === "CLIENT_CREATED") actionClass = "bg-slate-100 text-slate-700 border border-slate-200/50";
                        else if (log.action === "INVOICE_GENERATED") actionClass = "bg-amber-50 text-amber-800 border border-amber-200/60";
                        else if (log.action === "CLIENT_GST_UPDATED") actionClass = "bg-teal-50 text-teal-800 border border-teal-200/60";
                        else if (log.action === "AUTH_FAIL") actionClass = "bg-red-50 text-red-800 border border-red-200/60";
                        else if (log.action === "WORKSPACE_SETTINGS_CHANGED") actionClass = "bg-indigo-50 text-indigo-800 border border-indigo-200/60";

                        return (
                          <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full ${randomColor} border flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                                  {actorInitial}
                                </div>
                                <span className="font-bold text-slate-900">{log.actor}</span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider ${actionClass}`}>{log.action}</span>
                            </td>
                            <td className="py-3.5 text-slate-500 font-medium">{log.details}</td>
                            <td className="py-3.5 text-slate-400 font-medium">{log.time}</td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                : "bg-rose-50 text-rose-700 border border-rose-200/50"
                                }`}>{log.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-50 pt-4 mt-2 text-xs">
                  <span className="text-slate-400 font-bold">Showing 1-5 of 2,492 entries</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 font-bold transition-all">&lt;</button>
                    <button className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-sm">1</button>
                    <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold transition-all">2</button>
                    <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold transition-all">3</button>
                    <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 font-bold transition-all">&gt;</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase">Optimal</span>
                    </div>
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Security Score</h5>
                    <h4 className="font-extrabold text-slate-900 text-2xl">98/100</h4>
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-indigo-600">+2.4% vs last month</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: "98%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined text-[18px]">key</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase">Standard Encryption</span>
                    </div>
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ledger Integrity</h5>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-2">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                      Blocks Verified (SHA-256)
                    </h4>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-200/50 p-2 rounded-lg truncate">
                    LAST HASH: fca17643b9c745d...982c
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined text-[18px]">analytics</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase">Live</span>
                    </div>
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Activity Velocity</h5>
                    <div className="flex items-end gap-1 h-8 mt-2.5">
                      <div className="w-1.5 bg-indigo-100 h-4 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-200 h-6 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-300 h-5 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-600 h-8 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-500 h-7 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-200 h-4 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-400 h-6 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-600 h-8 rounded-full"></div>
                      <div className="w-1.5 bg-indigo-300 h-5 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    Average 42 events/hour today
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "integrations" && (
            <IntegrationsTab
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "payments" && (
            <PaymentsTab
              user={user}
              payments={payments}
              setPayments={setPayments}
              invoices={invoices}
              setInvoices={setInvoices}
              showToast={showToast}
            />
          )}

          {activePage === "reports" && (
            <ReportsTab
              user={user}
              clients={clients}
              invoices={invoices}
              subscriptions={subscriptions}
              payments={payments}
              showToast={showToast}
            />
          )}

          {activePage === "settings" && (
            <SettingsTab
              orgSettings={orgSettings}
              setOrgSettings={setOrgSettings}
              showToast={showToast}
            />
          )}

          {activePage === "profile" && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <h3 className="font-heading text-2xl font-bold text-slate-900">Personal Account</h3>
                <p className="text-slate-500 text-sm mt-1">Review verified profile credentials, update passwords, and enable MFA safety measures.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">person</span>
                  <h4 className="font-heading text-base font-bold text-slate-900">Identity & Security</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-semibold mb-1">Full Name</label>
                    <input type="text" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-semibold mb-1">Email (Verified)</label>
                    <input type="text" disabled className="w-full bg-slate-100 border border-slate-200/60 rounded-xl p-2.5 text-sm font-semibold opacity-60 outline-none cursor-not-allowed" value={profileEmail} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-semibold mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} />
                  </div>

                  <div className="flex items-center gap-2.5 py-1">
                    <input type="checkbox" id="2fa" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
                    <label htmlFor="2fa" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">Enable Two-Factor Authentication (MFA)</label>
                  </div>

                  <button onClick={() => showToast("Personal profile specifications updated.", "success")} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold text-xs transition-colors shadow-md w-fit flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    Update Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePage === "notifications" && (
            <NotificationsTab
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "audit" && (
            <AuditLogsTab
              user={user}
              showToast={showToast}
            />
          )}

        </div>
      </main>

      {/* Centralized Publish Announcement Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">

            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">publish</span>
                <h5 className="font-heading font-extrabold text-slate-900 text-base">Publish Announcement</h5>
              </div>
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setNewPostTitle("");
                  setNewPostContent("");
                  setNewPostImage("");
                  setNewPostAttachment(null);
                }}
                className="text-slate-400 hover:text-slate-600 material-symbols-outlined cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Select Subscription Plan</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all"
                  value={selectedPublishSubId}
                  onChange={(e) => setSelectedPublishSubId(e.target.value)}
                >
                  <option value="">-- Choose a Subscription Plan --</option>
                  {subscriptions.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.client})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Post Title</label>
                <input
                  type="text"
                  placeholder="e.g. Server Maintenance Notice"
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Update Details</label>
                <textarea
                  placeholder="Provide description of the release, server details..."
                  rows="4"
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all resize-none"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>

              {/* Cover Image Selector */}
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5 flex justify-between items-center">
                  <span>Announcement Cover Image</span>
                  {newPostImage && (
                    <button
                      type="button"
                      onClick={() => setNewPostImage("")}
                      className="text-rose-600 hover:text-rose-800 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </label>

                {newPostImage && (
                  <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-200 mb-2 shadow-sm">
                    <img src={newPostImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex flex-col items-center justify-center h-14 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group select-none">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 group-hover:text-indigo-600">
                      <span className="material-symbols-outlined text-[16px]">upload_file</span> Upload Cover
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewPostImage(reader.result);
                            showToast("Cover image loaded successfully!", "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { name: "Alert", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80" },
                      { name: "Metrics", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80" },
                      { name: "Network", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80" }
                    ].map(img => (
                      <button
                        key={img.name}
                        type="button"
                        onClick={() => setNewPostImage(img.url)}
                        className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${newPostImage === img.url ? "border-indigo-600 scale-[0.96]" : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Document Uploader */}
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5 flex justify-between items-center">
                  <span>Attach Reference Document (Optional)</span>
                  {newPostAttachment && (
                    <button
                      type="button"
                      onClick={() => setNewPostAttachment(null)}
                      className="text-rose-600 font-bold text-[9px] uppercase cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </label>
                {newPostAttachment ? (
                  <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600">description</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{newPostAttachment.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{newPostAttachment.size}</span>
                      </div>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">Attached</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl cursor-pointer transition-all group select-none">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-indigo-600">attach_file</span>
                    <span className="text-xs text-slate-500 font-bold group-hover:text-indigo-600">Attach PDF or Document from PC</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const sizeKb = Math.round(file.size / 1024);
                            setNewPostAttachment({
                              name: file.name,
                             size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
                              dataUrl: reader.result
                            });
                            showToast(`Attached file: ${file.name}!`, "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setNewPostTitle("");
                  setNewPostContent("");
                  setNewPostImage("");
                  setNewPostAttachment(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedPublishSubId) {
                    showToast("Please choose a subscription plan first!", "warning");
                    return;
                  }
                  handlePublishPost(selectedPublishSubId);
                  setShowPublishModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Publish Post
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
