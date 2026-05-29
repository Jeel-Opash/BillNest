import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const { user, logout, showToast } = useAuth();
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
    { id: "s1", name: "Website Maintenance Plan", price: 5000, cycle: "monthly", trialDays: 0, client: "ABC Restaurant", status: "active" },
    { id: "s2", name: "Cloud Support Plan", price: 12000, cycle: "monthly", trialDays: 14, client: "Nova Software Inc", status: "active" }
  ]);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState(3000);
  const [newPlanCycle, setNewPlanCycle] = useState("monthly");
  const [newPlanTrial, setNewPlanTrial] = useState(0);
  const [newPlanClient, setNewPlanClient] = useState("ABC Restaurant");


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
    setActivePage("invoices");
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
    const newSub = {
      id: `s${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      cycle: newPlanCycle,
      trialDays: newPlanTrial,
      client: newPlanClient,
      status: "active"
    };
    setSubscriptions([...subscriptions, newSub]);
    setNewPlanName("");
    setNewPlanPrice(3000);
    setNewPlanTrial(0);
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
    setInviteEmail("");
    showToast(`Workspace Invite sent to ${inviteEmail} (Privilege: ${inviteRole})!`, "success");
  };

  return (
    <div className="flex bg-background min-h-screen text-on-background font-body-md">

      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-4 bg-surface border-r border-outline-variant z-50">
        <div className="mb-8">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">CodeCraft Agency</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant">Admin Console Portal</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
            { id: "clients", label: "Clients", symbol: "group" },
            { id: "invoices", label: "Invoices", symbol: "receipt_long" },
            { id: "subscriptions", label: "Subscriptions", symbol: "autorenew" },
            { id: "payments", label: "Payments", symbol: "payments" },
            { id: "team", label: "Team Members", symbol: "badge" },
            { id: "reports", label: "Reports", symbol: "analytics" },
            { id: "notifications", label: `Notifications (${notifications.filter(n => !n.read).length})`, symbol: "notifications" },
            { id: "profile", label: "Profile Settings", symbol: "person" }
          ].map((menu) => {
            const isActive = activePage === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => handlePageChange(menu.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? "bg-secondary-fixed text-on-secondary-fixed scale-[0.98]"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined">{menu.symbol}</span>
                <span className="font-label-md text-label-md">{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-outline-variant flex items-center gap-3">
          <button
            onClick={() => handlePageChange("profile")}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity text-left outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-200/50 shadow-sm flex items-center justify-center font-extrabold text-white text-base select-none flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-on-surface text-xs truncate leading-snug">{user?.name || "Jeel Opash"}</span>
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Workspace Admin</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-6 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
          <div className="flex items-center">
            <div className="relative focus-within:ring-2 focus-within:ring-primary/20 rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg w-64 focus:ring-0 text-body-sm font-body-sm"
                placeholder="Search daily logs..." type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}/>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-label-sm font-label-sm whitespace-nowrap">Tenant Isolation: {user?.organization?.name || "CodeCraft Agency"}</span>
            </div>

            <div className="flex items-center gap-4 border-l border-outline-variant pl-6 relative">
              <button onClick={() => setActivePage("notifications")} className="text-on-surface-variant hover:text-primary transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all outline-none flex items-center justify-center"
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
                        <span className="font-bold text-slate-800 text-xs truncate">{user?.name || "Jeel Opash"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email || "rahul@codecraft.com"}</span>
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
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
                            showToast("Signed out successfully", "info");
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

          <div className="bg-gradient-to-r from-primary-fixed/30 to-surface p-6 rounded-2xl border border-outline-variant/30 flex justify-between items-center">
            <div>
              <h2 className="text-headline-lg font-display-lg mb-2 text-on-surface">Welcome to your Isolated Workspace, {user?.name.split(" ")[0]}!</h2>
              <p className="text-on-surface-variant max-w-2xl">
                Your account belongs to <strong className="text-primary">{user?.organization?.name || "CodeCraft Agency"}</strong>. Running daily operations and billing managers with enterprise-level isolation.
              </p>
            </div>
            <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Active Role Privileges
                </span>
                <span className="font-headline-md flex items-center gap-2 capitalize">
                  {user?.role} Manager <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </span>
              </div>
            </div>
          </div>

          {activePage === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Workspace Operations Summary</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">Total Billed Revenue</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4">₹{paidValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 font-label-sm">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Daily Transaction Monitor
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">Monthly Recurring Revenue (MRR)</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4 text-primary">₹{mrrValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-primary font-label-sm">
                    3 Active Schedules
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">Outstanding Payments</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4">₹{outstandingValue.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 text-error font-label-sm">
                    Reminders Scheduled
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-headline-md text-headline-md text-on-surface">Billing Activity Curve</h4>
                    <span className="px-2 py-1 bg-surface-container text-label-sm rounded text-on-surface-variant">Live</span>
                  </div>
                  <div className="h-64 relative w-full mb-4">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <path className="text-primary" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="fill-primary/10" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20 L 400 100 L 0 100 Z" />
                    </svg>
                    <div className="absolute inset-0 flex justify-between items-end pb-2 px-2 text-[10px] text-on-surface-variant uppercase font-bold">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May (Live)</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="font-headline-md text-headline-md text-on-surface">Recent Team Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">P</div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Priya updated ABC Restaurant</p>
                        <span className="text-[10px] text-on-surface-variant">3 mins ago</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">A</div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Amit updated GST number</p>
                        <span className="text-[10px] text-on-surface-variant">45 mins ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "clients" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Client Management</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Active Workspace Clients</h4>
                  <div className="space-y-3">
                    {clients.map(c => (
                      <div key={c.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-on-surface text-body-lg">{c.company}</h5>
                          <p className="text-body-sm text-on-surface-variant">POC: {c.name} | {c.email} | Phone: {c.phone}</p>
                          <p className="text-xs text-on-surface-variant opacity-80 mt-1">Tax ID: {c.taxId} | Address: {c.address}</p>
                        </div>
                        <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm font-bold">{c.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Add New Client</h4>
                  <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Client Name</label>
                      <input type="text" required placeholder="POC Name" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Company Name</label>
                      <input type="text" required placeholder="Business Name" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientCompany} onChange={(e) => setNewClientCompany(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Billing Email</label>
                      <input type="email" required placeholder="accounts@business.com" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Phone</label>
                      <input type="text" placeholder="+91 999 888 776" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Tax ID / GST Number</label>
                      <input type="text" placeholder="24ABCDE1234" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientTaxId} onChange={(e) => setNewClientTaxId(e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Currency</label>
                        <select className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientCurrency} onChange={(e) => setNewClientCurrency(e.target.value)}>
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Address</label>
                        <input type="text" placeholder="City" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                      Register Client
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {activePage === "invoices" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Invoice Operations</h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Create Workspace Invoice</h4>
                  <form onSubmit={handleCreateInvoice} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Select Client</label>
                        <select className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={builderClient} onChange={(e) => setBuilderClient(e.target.value)}>
                          {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Due Date</label>
                        <input type="date" required className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={builderDueDate} onChange={(e) => setBuilderDueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-3">
                      <span className="block font-bold text-on-surface text-label-md">Add Item Row</span>
                      <div className="grid grid-cols-12 gap-2">
                        <input type="text" placeholder="Description" className="col-span-6 bg-surface-container-lowest border-outline-variant rounded p-2 text-xs" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                        <input type="number" placeholder="Qty" className="col-span-2 bg-surface-container-lowest border-outline-variant rounded p-2 text-xs" min="1" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 1)} />
                        <input type="number" placeholder="Price" className="col-span-4 bg-surface-container-lowest border-outline-variant rounded p-2 text-xs" min="0" value={newPrice} onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)} />
                      </div>
                      <button type="button" onClick={handleAddBuilderItem} className="bg-primary/10 text-primary py-1 px-3 rounded text-xs font-bold hover:bg-primary/20">
                        + Append Line Item
                      </button>
                    </div>

                    {builderItems.length > 0 && (
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-on-surface-variant">Items Checklist:</span>
                        {builderItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-surface-container-low p-2 rounded text-xs border border-outline-variant/30">
                            <span>{item.desc} (x{item.qty})</span>
                            <span className="font-bold">₹{(item.qty * item.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Discount flat (₹)</label>
                        <input type="number" min="0" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={builderDiscount} onChange={(e) => setBuilderDiscount(parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Tax Rate (GST %)</label>
                        <input type="number" min="0" max="100" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={builderTaxRate} onChange={(e) => setBuilderTaxRate(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl space-y-2 text-body-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Subtotal</span>
                        <span>₹{itemsSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-error">
                        <span>Discount Deduction</span>
                        <span>- ₹{builderDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Tax Assessment (GST {builderTaxRate}%)</span>
                        <span>+ ₹{itemsTaxAmount.toLocaleString()}</span>
                      </div>
                      <hr className="border-outline-variant" />
                      <div className="flex justify-between font-bold text-body-lg text-primary">
                        <span>Final Invoice Total</span>
                        <span>₹{itemsFinalTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                      Deploy Generated Invoice Document
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Invoice History</h4>
                  <div className="space-y-3">
                    {invoices.map(inv => (
                      <div key={inv.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface">{inv.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : inv.status === "sent"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}>{inv.status}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">Client: {inv.client}</p>
                          <p className="text-[10px] text-on-surface-variant opacity-75">Issued: {inv.date} | Due: {inv.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <h5 className="font-bold text-on-surface">₹{inv.amount.toLocaleString()}</h5>
                          {inv.status === "sent" && (
                            <button
                              onClick={() => {
                                setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                                showToast(`Invoice ${inv.id} PAID.`, "success");
                              }}
                              className="mt-1 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold hover:bg-emerald-600"
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

          {activePage === "subscriptions" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Subscription Management</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Recurring Client Schedules</h4>
                  <div className="space-y-3">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-on-surface text-body-lg">{sub.name}</h5>
                          <p className="text-body-sm text-on-surface-variant">Client: {sub.client}</p>
                          <p className="text-xs text-on-surface-variant opacity-85">Cycle: {sub.cycle} | Trial Period: {sub.trialDays} days</p>
                        </div>
                        <div className="text-right">
                          <h5 className="font-bold text-primary">₹{sub.price.toLocaleString()}/mo</h5>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 inline-block uppercase">{sub.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Initialize Subscription Plan</h4>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Plan Title</label>
                      <input type="text" required placeholder="e.g. Website Maintenance Fee" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Recurring Price (₹)</label>
                        <input type="number" required min="1" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newPlanPrice} onChange={(e) => setNewPlanPrice(parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Billing Cycle</label>
                        <select className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newPlanCycle} onChange={(e) => setNewPlanCycle(e.target.value)}>
                          <option value="monthly">Monthly Recurring</option>
                          <option value="yearly">Yearly Recurring</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Target Client</label>
                        <select className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newPlanClient} onChange={(e) => setNewPlanClient(e.target.value)}>
                          {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Trial Days</label>
                        <input type="number" min="0" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={newPlanTrial} onChange={(e) => setNewPlanTrial(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                      Deploy Subscription Schedule
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {activePage === "payments" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Payments Ledger</h3>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                <h4 className="text-headline-md text-on-surface">Stripe Transaction logs</h4>
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{p.id}</span>
                          <span className="text-xs text-on-surface-variant">Invoice Reference: {p.invoice}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">Client: {p.client} | Channel: {p.method} | Timestamp: {p.date}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <h5 className="font-bold text-on-surface">₹{p.amount.toLocaleString()}</h5>
                        <div className="flex gap-2">
                          {p.status === "failed" && (
                            <button
                              onClick={() => {
                                setPayments(payments.map(item => item.id === p.id ? { ...item, status: "succeeded" } : item));
                                showToast(`Payment transaction ${p.id} retried successfully!`, "success");
                              }}
                              className="bg-primary text-white text-[9px] px-2 py-0.5 rounded font-bold hover:opacity-90"
                            >
                              Retry Now
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "succeeded" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "team" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Workspace Team Members</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Teammates Directory</h4>
                  <div className="space-y-3">
                    {teamList.map(t => (
                      <div key={t.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-on-surface text-body-lg">{t.name}</h5>
                          <p className="text-xs text-on-surface-variant">{t.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t.role}</span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-1 uppercase">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <div>
                    <h4 className="text-headline-md text-on-surface">Invite Teammate</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Admin constraint: Assignable roles restricted to Member & Read-Only Observer.</p>
                  </div>
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Teammate Gmail Account</label>
                      <input type="email" required placeholder="colleague@gmail.com" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Assign Privilege Role</label>
                      <select className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                        <option value="member">Workspace Member</option>
                        <option value="read_only">Read-Only Observer</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                      Send Secure Invite
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {activePage === "reports" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Reports</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Daily Billing Analytics</h4>
                  <div className="h-64 relative w-full mb-4">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                      <path className="text-emerald-500" d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="fill-emerald-500/10" d="M 0 90 L 100 80 L 200 60 L 300 45 L 400 15 L 400 100 L 0 100 Z" />
                    </svg>
                    <div className="absolute inset-0 flex justify-between items-end pb-2 px-2 text-[10px] text-on-surface-variant uppercase font-bold">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>June (Proj)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4 justify-between">
                  <div>
                    <h4 className="text-headline-md text-on-surface">Export Workspace Logs</h4>
                    <p className="text-body-sm text-on-surface-variant mt-2">Export transaction reports under your isolation key.</p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={handleExportCSV} className="w-full bg-surface-container-high text-on-surface-variant py-2.5 rounded-lg font-bold hover:bg-surface-container-highest transition-colors outline-none">
                      Export Invoices (.CSV)
                    </button>
                    <button onClick={handleExportPDF} className="w-full bg-primary border border-transparent text-on-primary py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity outline-none focus:outline-none focus:ring-0">
                      Export Tax statement (.PDF)
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activePage === "notifications" && (
            <div className="flex flex-col gap-6 max-w-3xl">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Daily Billing Alerts</h3>
                <button
                  onClick={() => {
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                    showToast("All alerts marked read.", "info");
                  }}
                  className="bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  Mark all as read
                </button>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-lg border flex justify-between items-center ${
                    n.read
                      ? "bg-surface-container-low border-outline-variant/30 text-on-surface-variant opacity-80"
                      : "bg-primary/5 border-primary/20 text-on-surface"
                  }`}>
                    <div className="flex items-center gap-3">
                      {!n.read && <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>}
                      <span className="text-body-sm font-semibold">{n.text}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant opacity-75">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === "profile" && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <h3 className="font-headline-md text-headline-md text-on-surface">Profile Settings</h3>
              
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                <h4 className="text-headline-md text-on-surface">Manage account credentials</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Full Name</label>
                    <input type="text" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Email (Non-editable)</label>
                    <input type="text" disabled className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm opacity-60" value={profileEmail} />
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Change Password</label>
                    <input type="password" className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="2fa-admin" className="rounded text-primary focus:ring-primary/20" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
                    <label htmlFor="2fa-admin" className="text-body-sm text-on-surface-variant">Enable Two-Factor Authentication (MFA)</label>
                  </div>
                  <button onClick={() => showToast("Profile settings saved successfully.", "success")} className="bg-primary text-on-primary py-2 px-4 rounded-lg font-bold hover:opacity-90 transition-opacity self-start">
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
