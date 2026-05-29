import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const MemberDashboard = () => {
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
  const [clientSearch, setClientSearch] = useState("");


  const [assignedClientsCount] = useState(8);
  const [pendingInvoicesCount] = useState(5);
  const [paidInvoicesCount] = useState(12);


  const [clients, setClients] = useState([
    { id: "c1", name: "ABC Restaurant", company: "ABC Food & Beverages", email: "owner@abcrestaurant.com", phone: "+91 98765 43210", taxId: "24ABCDE1234F1Z5", address: "Surat, Gujarat", currency: "INR", assignedBy: "Admin Priya", notes: "Billing cycle 1st of every month" },
    { id: "c2", name: "Pixel Studio", company: "Pixel Creative Labs", email: "finance@pixelstudio.com", phone: "+91 99988 77766", taxId: "27PIXEL7788A1Z9", address: "Mumbai, Maharashtra", currency: "INR", assignedBy: "Admin Priya", notes: "Prefers detailed GST reports" },
    { id: "c3", name: "Nova Software Inc", company: "Nova Tech Ltd", email: "billing@novatech.com", phone: "+1 (555) 234-5678", taxId: "US9988223", address: "Austin, Texas", currency: "USD", assignedBy: "Owner Rahul", notes: "Overseas wire transfer candidate" }
  ]);


  const [editingClient, setEditingClient] = useState(null);
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");


  const [invoices, setInvoices] = useState([
    { id: "INV-1026", client: "ABC Restaurant", amount: 15000, date: "2026-05-29", dueDate: "2026-06-12", status: "pending", items: [{ desc: "UI Design Retainer", qty: 1, price: 12000 }, { desc: "Hosting Retainer", qty: 1, price: 3000 }] },
    { id: "INV-1025", client: "Pixel Studio", amount: 25000, date: "2026-05-28", dueDate: "2026-06-10", status: "draft", items: [{ desc: "Website Retainer", qty: 1, price: 25000 }] },
    { id: "INV-1024", client: "Nova Software Inc", amount: 8000, date: "2026-05-25", dueDate: "2026-06-05", status: "paid", items: [{ desc: "Technical Support Support", qty: 8, price: 1000 }] }
  ]);
  const [builderClient, setBuilderClient] = useState("ABC Restaurant");
  const [builderDueDate, setBuilderDueDate] = useState("2026-06-15");
  const [builderDiscount, setBuilderDiscount] = useState(1000);
  const [builderTaxRate, setBuilderTaxRate] = useState(18);
  const [builderItems, setBuilderItems] = useState([
    { desc: "UI Design", qty: 1, price: 12000 },
    { desc: "Hosting Support", qty: 1, price: 3000 }
  ]);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);


  const [payments] = useState([
    { id: "TXN-80124", invoice: "INV-1024", client: "Nova Software Inc", amount: 8000, status: "succeeded", date: "2026-05-25" },
    { id: "TXN-80123", invoice: "INV-1023", client: "Pixel Studio", amount: 15000, status: "succeeded", date: "2026-05-20" }
  ]);


  const [notifications, setNotifications] = useState([
    { id: "n1", text: "ABC Restaurant viewed Invoice INV-1026.", time: "10 mins ago", read: false },
    { id: "n2", text: "Invoice INV-1024 was marked as paid.", time: "2 hours ago", read: false },
    { id: "n3", text: "Nova Software Inc payment processed successfully.", time: "1 day ago", read: true }
  ]);


  const [profileName, setProfileName] = useState("Amit Kumar");
  const [profileEmail] = useState("amit@codecraft.com");
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
    showToast(`Invoice Draft ${newInv.id} created successfully!`, "success");
    handlePageChange("invoices");
  };

  const handleUpdateClient = (e) => {
    e.preventDefault();
    if (!editingClient) return;
    setClients(clients.map(c => c.id === editingClient.id ? { ...c, phone: editPhone, notes: editNotes } : c));
    setEditingClient(null);
    showToast(`Client ${editingClient.company} details updated by Member.`, "success");
  };

  return (
    <div className="flex bg-background min-h-screen text-on-background font-body-md">

      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-4 bg-surface border-r border-outline-variant z-50">
        <div className="mb-8">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">CodeCraft Agency</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant">Member Console</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
            { id: "clients", label: "My Clients", symbol: "group" },
            { id: "invoices", label: "Invoices", symbol: "receipt_long" },
            { id: "payments", label: "Payments", symbol: "payments" },
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
              <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Workspace Member</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-6 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
          <div className="flex items-center">
            <div className="relative focus-within:ring-2 focus-within:ring-primary/20 rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg w-64 focus:ring-0 text-body-sm font-body-sm"
                placeholder="Search..."
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-label-sm font-label-sm whitespace-nowrap">Tenant Isolation: {user?.organization?.name || "CodeCraft Agency"}</span>
            </div>

            <div className="flex items-center gap-4 border-l border-outline-variant pl-6 relative">
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
                          Workspace Member
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setActivePage("profile");
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
              <h2 className="text-headline-lg font-display-lg mb-2 text-on-surface">Welcome back, {user?.name.split(" ")[0]}!</h2>
              <p className="text-on-surface-variant max-w-2xl">
                Your isolated member context is fully loaded. You have operational rights to construct billing invoices and manage your assigned clients.
              </p>
            </div>
            <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Active Role Privileges
                </span>
                <span className="font-headline-md flex items-center gap-2 capitalize">
                  {user?.role} Staff <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </span>
              </div>
            </div>
          </div>

          {activePage === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">My Workspace Operations</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">My Assigned Clients</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4">{assignedClientsCount} Clients</h3>
                  <div className="flex items-center gap-1 text-primary font-label-sm">
                    Assigned by Priya / Rahul
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">My Pending Invoices</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4">{pendingInvoicesCount} Pending</h3>
                  <div className="flex items-center gap-1 text-error font-label-sm">
                    Awaiting Stripe callback
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <p className="text-on-surface-variant text-label-md mb-2">My Paid Invoices</p>
                  <h3 className="text-headline-lg font-headline-lg mb-4 text-emerald-600">{paidInvoicesCount} Paid</h3>
                  <div className="flex items-center gap-1 text-emerald-600 font-label-sm">
                    Workspace processed successfully
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                <h4 className="font-headline-md text-headline-md text-on-surface mb-6">Workspace billing logs</h4>
                <div className="h-64 relative w-full mb-4">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                    <path className="text-primary" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="fill-primary/10" d="M 0 80 Q 50 85 100 70 T 200 75 T 300 50 T 400 20 L 400 100 L 0 100 Z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {activePage === "clients" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Assigned Clients Directory</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">My Assigned Clients</h4>
                  <div className="space-y-3">
                    {clients.map(c => (
                      <div key={c.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-on-surface text-body-lg">{c.company}</h5>
                          <p className="text-body-sm text-on-surface-variant">POC: {c.name} | {c.email} | Phone: {c.phone}</p>
                          <p className="text-xs text-on-surface-variant opacity-85 mt-1">Assigned By: {c.assignedBy} | Tax ID: {c.taxId}</p>
                          <p className="text-[10px] text-primary italic mt-0.5">Notes: {c.notes}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm font-bold">{c.currency}</span>
                          <button
                            onClick={() => {
                              setEditingClient(c);
                              setEditPhone(c.phone);
                              setEditNotes(c.notes);
                            }}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded text-xs font-bold"
                          >
                            Edit Notes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Client Metadata Settings</h4>
                  {editingClient ? (
                    <form onSubmit={handleUpdateClient} className="space-y-4">
                      <p className="text-xs text-on-surface-variant">Editing Contact details for: <strong className="text-primary">{editingClient.company}</strong></p>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">POC Contact Number</label>
                        <input type="text" required className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Internal Billing Notes</label>
                        <textarea className="w-full bg-surface-container-low border-outline-variant rounded-lg p-2 text-body-sm h-24" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                          Save Contact info
                        </button>
                        <button type="button" onClick={() => setEditingClient(null)} className="bg-surface-container-high text-on-surface-variant px-3 py-2 rounded-lg text-xs font-bold">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8 text-xs text-on-surface-variant opacity-85">
                      Select a client and click "Edit Notes" to modify POC details. As a Workspace Member, global creation or deletion privileges are restricted.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activePage === "invoices" && (
            <div className="flex flex-col gap-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Invoice Builder & Drafts</h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-4">
                  <h4 className="text-headline-md text-on-surface">Create Isolated Draft Invoice</h4>
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
                      Save Invoice Draft
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
                                : inv.status === "sent" || inv.status === "pending"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}>{inv.status}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">Client: {inv.client}</p>
                          <p className="text-[10px] text-on-surface-variant opacity-75">Issued: {inv.date} | Due: {inv.dueDate}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <h5 className="font-bold text-on-surface">₹{inv.amount.toLocaleString()}</h5>
                          {inv.status === "draft" && (
                            <button
                              onClick={() => {
                                setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: "pending" } : i));
                                showToast(`Invoice ${inv.id} sent to Client!`, "success");
                              }}
                              className="bg-primary text-white text-[9px] px-2 py-0.5 rounded font-bold hover:opacity-90"
                            >
                              Send Invoice
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
                        <p className="text-xs text-on-surface-variant mt-1">Client: {p.client} | Timestamp: {p.date}</p>
                      </div>
                      <div className="text-right">
                        <h5 className="font-bold text-on-surface">₹{p.amount.toLocaleString()}</h5>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">{p.status}</span>
                      </div>
                    </div>
                  ))}
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
                    <input type="checkbox" id="2fa-member-set" className="rounded text-primary focus:ring-primary/20" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
                    <label htmlFor="2fa-member-set" className="text-body-sm text-on-surface-variant">Enable Two-Factor Authentication (MFA)</label>
                  </div>
                  <button onClick={() => showToast("Member credentials saved successfully.", "success")} className="bg-primary text-on-primary py-2 px-4 rounded-lg font-bold hover:opacity-90 transition-opacity self-start">
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

export default MemberDashboard;
