import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const { user, logout, showToast, addLocalInvitation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [mrrValue] = useState(125000);
  const [outstandingValue] = useState(20000);
  const [paidValue] = useState(850000);

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
          <title>Tax Statement - ${user?.organization?.name || "CodeCraft Agency"}</title>
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
            <div class="meta">Organization: ${user?.organization?.name || "CodeCraft Agency"} | Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Invoiced Volume</div>
              <div class="card-value">₹${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Paid Revenue</div>
              <div class="card-value">₹${paidRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Estimated Tax Liability (18% GST)</div>
              <div class="card-value">₹${taxPaid.toLocaleString()}</div>
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
              ${invoices.map(inv => `
                <tr>
                  <td><strong>${inv.id}</strong></td>
                  <td>${inv.client}</td>
                  <td>${inv.date}</td>
                  <td><span style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: ${inv.status === 'paid' ? '#10b981' : '#ef4444'}">${inv.status}</span></td>
                  <td>₹${inv.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
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

  const [clients, setClients] = useState([
    { id: "c1", name: "ABC Restaurant", company: "ABC Food & Beverages", email: "owner@abcrestaurant.com", phone: "+91 98765 43210", taxId: "24ABCDE1234F1Z5", address: "Surat, Gujarat", currency: "INR", notes: "Prefers UPI payments" },
    { id: "c2", name: "Pixel Studio", company: "Pixel Creative Labs", email: "finance@pixelstudio.com", phone: "+91 99988 77766", taxId: "27PIXEL7788A1Z9", address: "Mumbai, Maharashtra", currency: "INR", notes: "Monthly billing cycle" },
    { id: "c3", name: "Nova Software Inc", company: "Nova Tech Ltd", email: "billing@novatech.com", phone: "+1 (555) 234-5678", taxId: "US9988223", address: "Austin, Texas", currency: "USD", notes: "Stripe recurring billing active" }
  ]);
  const [clientSearch, setClientSearch] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientTaxId, setNewClientTaxId] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientCurrency, setNewClientCurrency] = useState("INR");
  const [newClientNotes, setNewClientNotes] = useState("");

  const [invoices, setInvoices] = useState([
    { id: "INV-1025", client: "XYZ Pvt Ltd", amount: 18000, date: "2026-05-29", dueDate: "2026-06-12", status: "sent", items: [{ desc: "Custom Plugin Integration", qty: 1, price: 18000 }] },
    { id: "INV-1024", client: "ABC Restaurant", amount: 34220, date: "2026-05-28", dueDate: "2026-06-10", status: "sent", items: [{ desc: "Website Design", qty: 1, price: 25000 }, { desc: "Hosting Support", qty: 12, price: 500 }] },
    { id: "INV-1023", client: "Pixel Studio", amount: 15000, date: "2026-05-20", dueDate: "2026-05-30", status: "paid", items: [{ desc: "Logo Design Pro Package", qty: 1, price: 15000 }] }
  ]);
  const [builderClient, setBuilderClient] = useState("ABC Restaurant");
  const [builderDueDate, setBuilderDueDate] = useState("2026-06-15");
  const [builderDiscount, setBuilderDiscount] = useState(2000);
  const [builderTaxRate, setBuilderTaxRate] = useState(18);
  const [builderItems, setBuilderItems] = useState([
    { desc: "Website Design", qty: 1, price: 25000 },
    { desc: "Hosting Support", qty: 12, price: 500 }
  ]);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  const [subscriptions, setSubscriptions] = useState([
    { id: "s1", name: "Website Maintenance Plan", price: 5000, cycle: "monthly", trialDays: 0, client: "ABC Restaurant", status: "active", picture: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80" },
    { id: "s2", name: "Cloud Support Plan", price: 12000, cycle: "monthly", trialDays: 14, client: "Nova Software Inc", status: "active", picture: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=500&q=80" }
  ]);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState(3000);
  const [newPlanCycle, setNewPlanCycle] = useState("monthly");
  const [newPlanTrial, setNewPlanTrial] = useState(0);
  const [newPlanClient, setNewPlanClient] = useState("ABC Restaurant");
  const [newPlanPicture, setNewPlanPicture] = useState("web");
  const [newPlanCustomUrl, setNewPlanCustomUrl] = useState("");

  const [payments, setPayments] = useState([
    { id: "TXN-90241", invoice: "INV-1023", client: "Pixel Studio", method: "Stripe Card", amount: 15000, status: "succeeded", date: "2026-05-20" },
    { id: "TXN-90240", invoice: "INV-1022", client: "Nova Software Inc", method: "Stripe Card", amount: 5000, status: "failed", date: "2026-05-15" }
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [teamList, setTeamList] = useState([
    { id: "t1", name: "Rahul Patel", email: "rahul@codecraft.com", role: "owner", status: "active" },
    { id: "t2", name: "Amit Kumar", email: "amit@codecraft.com", role: "member", status: "active" },
    { id: "t3", name: "Neha Patel", email: "neha@codecraft.com", role: "read_only", status: "pending" }
  ]);

  const [auditLogs] = useState([
    { id: "a1", action: "CLIENT_UPDATED", actor: "Priya Sharma (Admin)", details: "Updated tax ID for ABC Food & Beverages", time: "18 minutes ago", status: "SUCCESS" },
    { id: "a2", action: "INVOICE_SENT", actor: "Priya Sharma (Admin)", details: "Sent INV-1025 to XYZ Pvt Ltd", time: "2 hours ago", status: "SUCCESS" },
    { id: "a3", action: "PAYMENT_RETRY", actor: "System", details: "Retry scheduled for failed Stripe payment TXN-90240", time: "1 day ago", status: "PENDING" },
    { id: "a4", action: "ROLE_CHANGED", actor: "Priya Sharma (Admin)", details: "Changed Neha Patel to Read-Only Observer", time: "2 days ago", status: "SUCCESS" }
  ]);

  const [apiKeys, setApiKeys] = useState([
    { id: "k1", label: "Admin reporting integration", last4: "81bc", createdAt: "2026-05-28", active: true }
  ]);
  const [newKeyLabel, setNewKeyLabel] = useState("");

  const [orgSettings, setOrgSettings] = useState({
    currency: "INR",
    timezone: "Asia/Kolkata",
    taxRate: 18,
    invoicePrefix: "CC"
  });

  const [notifications, setNotifications] = useState([
    { id: "n1", text: "ABC Restaurant paid Invoice INV-1023 successfully.", time: "1 hour ago", read: false },
    { id: "n2", text: "Nova Software Inc failed card payment retry scheduled.", time: "1 day ago", read: false }
  ]);

  const [profileName, setProfileName] = useState("Priya Sharma");
  const [profileEmail] = useState("priya@codecraft.com");
  const [profilePassword, setProfilePassword] = useState("••••••••");
  const [enable2FA, setEnable2FA] = useState(false);

  const itemsSubtotal = builderItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
  const itemsTaxAmount = Math.round((itemsSubtotal - builderDiscount) * (builderTaxRate / 100));
  const itemsFinalTotal = Math.max(0, itemsSubtotal - builderDiscount + itemsTaxAmount);

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
    showToast(`Invoice ${newInv.id} drafted successfully.`, "success");
    handlePageChange("invoices");
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
    showToast(`Client ${newClientName} added by Admin.`, "success");
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlanName || newPlanPrice <= 0) return;

    const visualPresetUrls = {
      web: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80",
      cloud: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=500&q=80",
      design: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=500&q=80",
      marketing: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80"
    };

    const selectedCoverUrl = newPlanPicture === "custom" && newPlanCustomUrl
      ? newPlanCustomUrl
      : (visualPresetUrls[newPlanPicture] || visualPresetUrls.web);

    const newSub = {
      id: `s${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      cycle: newPlanCycle,
      trialDays: newPlanTrial,
      client: newPlanClient,
      status: "active",
      picture: selectedCoverUrl
    };
    setSubscriptions([...subscriptions, newSub]);
    setNewPlanName("");
    setNewPlanPrice(3000);
    setNewPlanTrial(0);
    setNewPlanCustomUrl("");
    showToast(`Subscription plan '${newPlanName}' deployed by Admin.`, "success");
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
    showToast(`Workspace Invite sent to ${inviteEmail} (Privilege: ${inviteRole})!`, "success");
  };

  const handleDeleteTeammate = (id, name) => {
    const target = teamList.find(t => t.id === id);
    if (target?.role === "owner") {
      showToast("Cannot remove the Workspace Owner.", "error");
      return;
    }
    setTeamList(teamList.filter(t => t.id !== id));
    showToast(`Teammate ${name} removed from workspace.`, "info");
  };

  const handleCreateApiKey = (e) => {
    e.preventDefault();
    if (!newKeyLabel.trim()) return;
    const newKey = {
      id: `k${Date.now()}`,
      label: newKeyLabel,
      last4: Math.random().toString(16).slice(2, 6),
      createdAt: new Date().toISOString().split("T")[0],
      active: true
    };
    setApiKeys([newKey, ...apiKeys]);
    setNewKeyLabel("");
    showToast("Tenant API key generated. Plain key should be copied once.", "success");
  };

  // Filter out clients that match the search input in Header
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.company.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-700 font-sans antialiased">

      {/* Sidebar Layout matching Owner Dashboard aesthetics */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-5 bg-white border-r border-slate-100 z-50">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate max-w-[150px]">{user?.organization?.name || "Workspace"}</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase mt-0.5">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {[
            { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
            { id: "invoices", label: "Invoices", symbol: "receipt_long" },
            { id: "subscriptions", label: "Subscriptions", symbol: "autorenew" },
            { id: "payments", label: "Payments", symbol: "payments" },
            { id: "team", label: "Team Members", symbol: "badge" },
            { id: "reports", label: "Reports", symbol: "analytics" },
            { id: "audit", label: "Audit Logs", symbol: "terminal" },
            { id: "settings", label: "Settings & API Keys", symbol: "settings" },
            { id: "notifications", label: `Notifications (${notifications.filter(n => !n.read).length})`, symbol: "notifications" },
            { id: "profile", label: "Profile Settings", symbol: "person" }
          ].map((menu) => {
            const isActive = activePage === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => handlePageChange(menu.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-150 text-left cursor-pointer text-xs ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{menu.symbol}</span>
                <span>{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => handlePageChange("profile")}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity text-left outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-200/50 shadow-sm flex items-center justify-center font-extrabold text-white text-sm select-none flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-[11px] truncate leading-snug">{user?.name || "Priya Sharma"}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Workspace Admin</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        {/* Global sticky Header */}
        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center">
            <div className="relative focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl transition-all">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl w-64 text-xs font-semibold focus:outline-none transition-all"
                placeholder="Search Clients..."
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center px-3 py-1 bg-indigo-50/80 text-indigo-600 border border-indigo-100/30 rounded-full gap-1.5 select-none">
              <span className="material-symbols-outlined text-[15px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{user?.organization?.name || "CodeCraft Agency"}</span>
            </div>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6 relative">
              <button
                onClick={() => handlePageChange("notifications")}
                className="text-slate-400 hover:text-slate-600 transition-colors relative cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_6px_#4f46e5]"></span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all outline-none flex items-center justify-center cursor-pointer"
                >
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs select-none">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-3 z-50 flex flex-col gap-2.5 animate-fade-in text-slate-700">
                      <div className="px-2 py-1.5 border-b border-slate-50 flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-xs truncate">{user?.name || "Priya Sharma"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email || "priya@codecraft.com"}</span>
                        <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded w-fit leading-none">
                          Workspace Admin
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            handlePageChange("profile");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          Profile Settings
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-50">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

        {/* Outer body view */}
        <div className="p-8 w-full flex-1 flex flex-col gap-8 animate-fade-in">

          {/* Welcome Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-slate-900 font-heading text-2xl font-black tracking-tight">Welcome, {user?.name.split(" ")[0]}!</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold max-w-xl">
                Running isolated workspace parameters and daily invoicing dispatch pipelines for <strong className="text-indigo-600">{user?.organization?.name || "CodeCraft Agency"}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100/50 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span>
              <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider">Role privileges active</span>
            </div>
          </div>

          {/* 1. Dashboard Tab */}
          {activePage === "dashboard" && (
            <div className="flex flex-col gap-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Billed Revenue</p>
                  <h3 className="text-slate-900 font-heading text-3xl font-black tracking-tight">₹{paidValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-wide mt-3.5">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    Daily Transaction Monitor
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Monthly Recurring Revenue</p>
                  <h3 className="text-indigo-600 font-heading text-3xl font-black tracking-tight">₹{mrrValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-indigo-500 font-bold text-[10px] uppercase tracking-wide mt-3.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    3 Active Schedules
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Outstanding Invoices</p>
                  <h3 className="text-slate-900 font-heading text-3xl font-black tracking-tight">₹{outstandingValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-[10px] uppercase tracking-wide mt-3.5">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Reminders Scheduled
                  </div>
                </div>
              </div>

              {/* Activity curve & recent activity */}
              <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Billing Activity Curve</h4>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 text-[9px] font-black uppercase text-indigo-600 rounded">Live Feed</span>
                  </div>
                  <div className="h-64 relative w-full mb-4">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <path className="text-indigo-600" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      <path className="fill-indigo-50/30" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20 L 400 100 L 0 100 Z" />
                    </svg>
                    <div className="absolute inset-0 flex justify-between items-end pb-2 px-2 text-[9px] text-slate-400 font-extrabold uppercase">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May (Live)</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Teammate Logs</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center font-black text-xs">P</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">Priya edited ABC Restaurant</p>
                        <span className="text-[9px] text-slate-400 font-semibold">3 mins ago</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 flex items-center justify-center font-black text-xs">A</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">Amit updated GST details</p>
                        <span className="text-[9px] text-slate-400 font-semibold">45 mins ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Clients Tab */}
          {activePage === "clients" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Isolated Clients</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">View and search localized clients associated with the workspace database.</p>
              </div>

              <div className="w-full">
                
                {/* Client directory */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Client Directory</h4>
                    <span className="bg-indigo-50 border border-indigo-100/40 text-indigo-600 text-[10px] font-black px-2.5 py-0.5 rounded-full">{filteredClients.length} Contacts</span>
                  </div>

                  <div className="space-y-4">
                    {filteredClients.map(c => (
                      <div key={c.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-100 transition-all">
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-slate-900 text-sm truncate">{c.company}</h5>
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                            POC: <span className="font-bold text-slate-700">{c.name}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                            {c.email}
                          </p>
                          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">
                            GST: {c.taxId || "N/A"} • Currency: {c.currency}
                          </p>
                        </div>
                        <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-extrabold select-none">{c.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Invoices Tab */}
          {activePage === "invoices" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Invoice Operations</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Generate new client drafts or review dispatched invoice cycles.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Create invoice */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Draft Workspace Invoice</h4>
                  <form onSubmit={handleCreateInvoice} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Select Client</label>
                        <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={builderClient} onChange={(e) => setBuilderClient(e.target.value)}>
                          {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Due Date</label>
                        <input type="date" required className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2 text-xs font-semibold transition-all outline-none cursor-pointer" value={builderDueDate} onChange={(e) => setBuilderDueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/40 border border-slate-100 rounded-2xl space-y-3">
                      <span className="block font-heading text-xs font-bold text-slate-800 uppercase tracking-wide">Line Items Generator</span>
                      <div className="grid grid-cols-12 gap-2">
                        <input type="text" placeholder="Item description" className="col-span-6 bg-white border border-slate-200/80 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                        <input type="number" placeholder="Qty" className="col-span-2 bg-white border border-slate-200/80 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none" min="1" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 1)} />
                        <input type="number" placeholder="Price" className="col-span-4 bg-white border border-slate-200/80 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none" min="0" value={newPrice} onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)} />
                      </div>
                      <button type="button" onClick={handleAddBuilderItem} className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 py-1.5 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer">
                        + Append Line Item
                      </button>
                    </div>

                    {builderItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items Ledger:</span>
                        {builderItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-slate-50/50 p-2.5 rounded-xl text-xs border border-slate-100 font-semibold">
                            <span className="text-slate-600">{item.desc} (x{item.qty})</span>
                            <span className="font-bold text-slate-900">₹{(item.qty * item.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Discount Deduction (₹)</label>
                        <input type="number" min="0" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={builderDiscount} onChange={(e) => setBuilderDiscount(parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST Tax Assessment (%)</label>
                        <input type="number" min="0" max="100" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={builderTaxRate} onChange={(e) => setBuilderTaxRate(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-slate-800">₹{itemsSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Discount Deduction</span>
                        <span>- ₹{builderDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Tax Assessment (GST {builderTaxRate}%)</span>
                        <span>+ ₹{itemsTaxAmount.toLocaleString()}</span>
                      </div>
                      <hr className="border-slate-100" />
                      <div className="flex justify-between font-extrabold text-sm text-indigo-600">
                        <span>Final Document Total</span>
                        <span>₹{itemsFinalTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 cursor-pointer">
                      Draft Invoiced Bill Document
                    </button>
                  </form>
                </div>

                {/* Invoice list */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Invoice Dispatches</h4>
                  <div className="space-y-3">
                    {invoices.map(inv => (
                      <div key={inv.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{inv.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : inv.status === "sent"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>{inv.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">Client: {inv.client}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">Due Date: {inv.dueDate}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <h5 className="font-black text-slate-900 text-xs">₹{inv.amount.toLocaleString()}</h5>
                          {inv.status === "sent" && (
                            <button
                              onClick={() => {
                                setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                                showToast(`Invoice ${inv.id} updated as PAID.`, "success");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-lg font-black transition-all cursor-pointer shadow-sm hover:shadow-emerald-100"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. Subscriptions Tab */}
          {activePage === "subscriptions" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Recurring Subscriptions</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Deploy and assign recurring billing cycles across isolations.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* List subscriptions */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Client Subscription Cards</h4>
                    <span className="bg-indigo-50 border border-indigo-100/40 text-indigo-600 text-[10px] font-black px-2.5 py-0.5 rounded-full">{subscriptions.length} Schedules</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="group bg-slate-50/30 rounded-2xl border border-slate-100 overflow-hidden hover:border-indigo-200/60 transition-all flex flex-col">
                        <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                          <img
                            src={sub.picture || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80"}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <span className="absolute top-2.5 right-2.5 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm">
                            {sub.status}
                          </span>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-1 gap-2.5 justify-between">
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-2 leading-snug">{sub.name}</h5>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-semibold truncate">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">domain</span>
                              {sub.client}
                            </p>
                          </div>
                          
                          <div className="pt-2.5 border-t border-slate-100/60 flex items-center justify-between">
                            <div>
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-wide">Recurring Cost</p>
                              <h6 className="font-black text-indigo-600 text-xs">₹{sub.price.toLocaleString()} <span className="text-[9px] font-semibold text-slate-500">/{sub.cycle === "monthly" ? "mo" : "yr"}</span></h6>
                            </div>
                            <div className="text-right">
                              <span className="inline-block bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[8px] font-extrabold">
                                {sub.trialDays > 0 ? `${sub.trialDays}d Trial` : "No Trial"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deploy subscription */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">INITIALIZE RECURRING PLAN</h4>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">SUBSCRIPTION PLAN NAME</label>
                      <input type="text" required placeholder="e.g. Website Maintenance Fee" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">PLAN COVER THEME</label>
                        <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={newPlanPicture} onChange={(e) => setNewPlanPicture(e.target.value)}>
                          <option value="web">🌐 Web / Code Preset</option>
                          <option value="cloud">☁️ Cloud Preset</option>
                          <option value="design">🎨 UI/UX Preset</option>
                          <option value="marketing">🚀 Growth Preset</option>
                          <option value="custom">🔗 Custom image URL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">CUSTOM COVER URL</label>
                        <input
                          type="text"
                          disabled={newPlanPicture !== "custom"}
                          placeholder={newPlanPicture === "custom" ? "https://example.com/cover.jpg" : "Locked (using Preset)"}
                          className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none disabled:opacity-50"
                          value={newPlanCustomUrl}
                          onChange={(e) => setNewPlanCustomUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">PRICING (₹)</label>
                        <input type="number" required min="1" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={newPlanPrice} onChange={(e) => setNewPlanPrice(parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">BILLING INTERVAL</label>
                        <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={newPlanCycle} onChange={(e) => setNewPlanCycle(e.target.value)}>
                          <option value="monthly">Monthly Cycle</option>
                          <option value="yearly">Yearly Cycle</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">TARGET CLIENT</label>
                        <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={newPlanClient} onChange={(e) => setNewPlanClient(e.target.value)}>
                          {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">TRIAL PERIOD (DAYS)</label>
                        <input type="number" min="0" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={newPlanTrial} onChange={(e) => setNewPlanTrial(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 cursor-pointer">
                      Launch Recurring Schedule
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* 5. Payments Tab */}
          {activePage === "payments" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Payments Ledger</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Monitor Stripe card integrations and payment statuses.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Stripe Card Transaction History</h4>
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{p.id}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ref: {p.invoice}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1">Client: {p.client} | Channel: {p.method} | Date: {p.date}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <h5 className="font-black text-slate-900 text-xs">₹{p.amount.toLocaleString()}</h5>
                        <div className="flex gap-2">
                          {p.status === "failed" && (
                            <button
                              onClick={() => {
                                setPayments(payments.map(item => item.id === p.id ? { ...item, status: "succeeded" } : item));
                                showToast(`Transaction ${p.id} retried and SUCCEEDED!`, "success");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-2.5 py-0.5 rounded-lg font-black transition-all cursor-pointer"
                            >
                              Retry card charge
                            </button>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-xl border text-[8px] font-black uppercase tracking-wider ${
                            p.status === "succeeded"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Team Tab */}
          {activePage === "team" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Workspace Teammates</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Invite and manage colleague access. Privilege controls are role-scoped to Admin level.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Teammates Directory */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Workspace Teammates Directory</h4>
                  <div className="space-y-4">
                    {teamList.map(t => (
                      <div key={t.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs select-none">
                            {t.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm leading-snug">{t.name}</h5>
                            <p className="text-[10px] text-slate-400 font-semibold">{t.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {t.role === "owner" || t.role === "admin" ? (
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider select-none">{t.role}</span>
                          ) : (
                            <select
                              value={t.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setTeamList(teamList.map(item => item.id === t.id ? { ...item, role: newRole } : item));
                                showToast(`Teammate role updated to ${newRole.toUpperCase()}.`, "success");
                              }}
                              className="bg-white border border-slate-200/80 focus:border-indigo-600 rounded-lg py-1 px-2.5 text-[10px] font-extrabold cursor-pointer transition-all outline-none"
                            >
                              <option value="member">Workspace Member</option>
                              <option value="read_only">Read-Only Observer</option>
                            </select>
                          )}

                          <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:inline-block ${
                            t.status === "active" ? "text-emerald-600" : "text-amber-500 animate-pulse"
                          }`}>{t.status}</span>

                          {t.role !== "owner" && (
                            <button
                              onClick={() => handleDeleteTeammate(t.id, t.name)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer outline-none"
                              title="Remove Teammate"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Teammate */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Invite Teammate</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Admin Restriction: Role invitations limited to Member & Read-Only Observer.</p>
                  </div>
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Teammate Gmail Account</label>
                      <input type="email" required placeholder="colleague@gmail.com" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Assign Privilege Role</label>
                      <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                        <option value="member">Workspace Member</option>
                        <option value="read_only">Read-Only Observer</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 cursor-pointer">
                      Send Secure Invite
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* 7. Reports Tab */}
          {activePage === "reports" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Workspace Reports</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Export isolated billing data ledgers directly into CSV or PDF format.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Daily Billing Curve Forecast</h4>
                  <div className="h-64 relative w-full mb-4">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <path className="text-emerald-500" d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      <path className="fill-emerald-500/10" d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15 L 400 100 L 0 100 Z" />
                    </svg>
                    <div className="absolute inset-0 flex justify-between items-end pb-2 px-2 text-[9px] text-slate-400 font-extrabold uppercase">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>June (Proj)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-6 h-full justify-between">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Export Data Files</h4>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-2">Generate and download cryptographically secure reports under your isolated tenant profile parameters.</p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={handleExportCSV} className="w-full bg-slate-50 hover:bg-slate-100/80 text-slate-600 border border-slate-100 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer outline-none">
                      Export Ledger (.CSV)
                    </button>
                    <button onClick={handleExportPDF} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 cursor-pointer outline-none">
                      Export Tax Statement (.PDF)
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 8. Audit Logs Tab */}
          {activePage === "audit" && (
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Compliance Audit Logs</h3>
                  <p className="text-slate-400 text-xs mt-1.5 font-semibold">Cryptographically-linked, append-only logs tracking workspace mutations.</p>
                </div>
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-3.5 py-1 rounded-full select-none uppercase tracking-wide">Immutable</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-200 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs leading-snug">{log.action}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>{log.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">{log.details}</p>
                    </div>
                    <div className="text-left md:text-right min-w-[120px]">
                      <p className="text-xs font-extrabold text-slate-800">{log.actor}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Settings Tab */}
          {activePage === "settings" && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Workspace Settings</h3>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Defaults and security parameters scoped specifically to Admin context.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Billing defaults */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Workspace Invoicing Parameters</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Currency</label>
                      <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none cursor-pointer" value={orgSettings.currency} onChange={(e) => setOrgSettings({ ...orgSettings, currency: e.target.value })}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Tax rate (%)</label>
                      <input type="number" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={orgSettings.taxRate} onChange={(e) => setOrgSettings({ ...orgSettings, taxRate: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice prefix</label>
                      <input className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={orgSettings.invoicePrefix} onChange={(e) => setOrgSettings({ ...orgSettings, invoicePrefix: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Timezone</label>
                      <input className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={orgSettings.timezone} onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })} />
                    </div>
                  </div>
                  <button onClick={() => showToast("Admin billing defaults saved.", "success")} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 self-start cursor-pointer mt-2">
                    Save defaults
                  </button>
                </div>

                {/* API keys */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Tenant API Integration Keys</h4>
                  <form onSubmit={handleCreateApiKey} className="flex gap-2">
                    <input className="flex-1 bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none" placeholder="Integration tag label" value={newKeyLabel} onChange={(e) => setNewKeyLabel(e.target.value)} />
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold text-xs transition-all cursor-pointer">Generate</button>
                  </form>

                  <div className="space-y-3">
                    {apiKeys.map(key => (
                      <div key={key.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all animate-slide-up">
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{key.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">saas_tenant_********{key.last4} · {key.createdAt}</p>
                        </div>
                        <button
                          onClick={() => {
                            setApiKeys(apiKeys.map(item => item.id === key.id ? { ...item, active: false } : item));
                            showToast("Integration API key revoked.", "info");
                          }}
                          disabled={!key.active}
                          className="bg-rose-50 border border-rose-100 hover:bg-rose-100/60 disabled:bg-slate-100 disabled:border-transparent disabled:text-slate-400 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                        >
                          {key.active ? "Revoke" : "Revoked"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 10. Notifications Tab */}
          {activePage === "notifications" && (
            <div className="flex flex-col gap-8 max-w-3xl">
              <div className="flex justify-between items-center">
                <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Billing Notifications</h3>
                <button
                  onClick={() => {
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                    showToast("All workspace alerts marked as read.", "info");
                  }}
                  className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                    n.read
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 opacity-75"
                      : "bg-indigo-50/30 border-indigo-100/50 text-slate-700"
                  }`}>
                    <div className="flex items-center gap-3">
                      {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_6px_#4f46e5]"></span>}
                      <span className="text-xs font-bold">{n.text}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. Profile Tab */}
          {activePage === "profile" && (
            <div className="flex flex-col gap-8 max-w-2xl">
              <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Profile Settings</h3>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">Manage Credentials</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Email (Immutable)</label>
                    <input type="text" disabled className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl p-2.5 text-xs font-semibold opacity-60 outline-none select-none" value={profileEmail} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Update Password</label>
                    <input type="password" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3 py-1 select-none">
                    <input type="checkbox" id="2fa-admin" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-100 cursor-pointer" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
                    <label htmlFor="2fa-admin" className="text-xs text-slate-500 font-semibold cursor-pointer">Enable Multi-Factor Authentication (MFA)</label>
                  </div>
                  <button onClick={() => showToast("Admin profile credentials saved successfully.", "success")} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow-indigo-100 self-start cursor-pointer mt-2">
                    Update Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
};

export default AdminDashboard;
