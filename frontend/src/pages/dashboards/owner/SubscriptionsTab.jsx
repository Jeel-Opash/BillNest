import React, { useState, useMemo } from "react";
import StripeCheckoutModal from "../../../components/StripeCheckoutModal";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const SubscriptionsTab = ({
  user,
  clients = [],
  subscriptions = [],
  setSubscriptions,
  invoices = [],
  payments = [],
  setPayments,
  showToast
}) => {

  const [activePlanFilter, setActivePlanFilter] = useState("all");


  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedSubForPost, setSelectedSubForPost] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");


  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_announcements`);
      return saved ? JSON.parse(saved) : [
        { id: "p1", subscriptionId: "s1", title: "API Maintenance Window", content: "We are scheduling a short database migration support window on Sunday between 2:00 AM and 3:00 AM IST.", date: "Jun 1, 2026" }
      ];
    } catch {
      return [];
    }
  });

  const saveAnnouncements = (newAnn) => {
    setAnnouncements(newAnn);
    localStorage.setItem(`workspace_${user?.email || "guest"}_announcements`, JSON.stringify(newAnn));
  };


  const [historyClientName, setHistoryClientName] = useState(null);


  const [editingPlan, setEditingPlan] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);


  const [createName, setCreateName] = useState("");
  const [createTier, setCreateTier] = useState("starter");
  const [createPrice, setCreatePrice] = useState(5000);
  const [createCycle, setCreateCycle] = useState("monthly");
  const [createClient, setCreateClient] = useState(clients[0]?.company || "");
  const [createTrial, setCreateTrial] = useState(0);
  const [createLogo, setCreateLogo] = useState("");


  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      if (activePlanFilter === "all") return true;
      return sub.status?.toLowerCase() === activePlanFilter.toLowerCase();
    });
  }, [subscriptions, activePlanFilter]);


  const totalMonthlyMRR = useMemo(() => {
    return subscriptions
      .filter(s => s.status?.toLowerCase() === "active")
      .reduce((sum, s) => {
        const cost = Number(s.price) || 0;
        if (s.cycle === "yearly") return sum + Math.round(cost / 12);
        if (s.cycle === "quarterly") return sum + Math.round(cost / 3);
        return sum + cost;
      }, 0);
  }, [subscriptions]);




  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);

  const handleCreatePlanSubmit = (e) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast("Plan Title is required.", "error");
      return;
    }

    const clientCompany = createClient || (clients[0]?.company || "ABC Restaurant");
    const clientEmail = clients.find(c => c.company === clientCompany)?.email || "billing@client.com";

    const mockInv = {
      id: `SUB-PAY-${Date.now()}`,
      amount: createPrice,
      client: clientCompany,
      clientEmail: clientEmail,
      items: [{ desc: `${createName} (${createTier})`, qty: 1, price: createPrice }]
    };
    setCheckoutInvoice(mockInv);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (txn) => {
    const newSub = {
      id: `s_${Date.now()}`,
      name: createName,
      tier: createTier,
      price: createPrice,
      cycle: createCycle,
      trialDays: createTrial,
      client: createClient || (clients[0]?.company || "ABC Restaurant"),
      status: "active",
      imageUrl: createLogo || ""
    };

    setSubscriptions([...subscriptions, newSub]);

    const orgKey = user?.organization?.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "guest";
    const existingPayments = JSON.parse(localStorage.getItem(`workspace_shared_payments_${orgKey}`) || "[]");
    
    const newPayment = {
      id: txn.txnId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoice: txn.invoice || `SUB-PAY-${Date.now()}`,
      client: newSub.client,
      method: txn.method || "Stripe Card",
      amount: createPrice,
      status: "succeeded",
      date: txn.date || new Date().toISOString().split("T")[0]
    };

    const updatedPayments = [newPayment, ...existingPayments];
    localStorage.setItem(`workspace_shared_payments_${orgKey}`, JSON.stringify(updatedPayments));

    if (setPayments) {
      setPayments(updatedPayments);
    }

    showToast(`Recurring Plan "${createName}" activated and payment of ₹${createPrice.toLocaleString()} processed via Stripe!`, "success");
    
    setCreateName("");
    setCreateTier("starter");
    setCreatePrice(5000);
    setCreateCycle("monthly");
    setCreateTrial(0);
    setCreateLogo("");
    setCreatingPlan(false);
    setIsCheckoutOpen(false);
  };


  const handleEditPlanSubmit = (e) => {
    e.preventDefault();
    if (!editingPlan.name.trim()) {
      showToast("Plan Title is required.", "error");
      return;
    }

    setSubscriptions(subscriptions.map(s => s.id === editingPlan.id ? editingPlan : s));
    showToast(`Subscription "${editingPlan.name}" updated successfully.`, "success");
    setEditingPlan(null);
  };


  const handleToggleSuspend = (subId, isSuspended) => {
    const nextStatus = isSuspended ? "active" : "suspended";
    setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, status: nextStatus } : s));
    showToast(
      isSuspended 
        ? `Subscription successfully resumed.` 
        : `Subscription suspended. Recurring invoicing halted.`, 
      "info"
    );
  };


  const handleCancelSubscription = (subId, name) => {
    if (window.confirm(`Are you sure you want to cancel subscription plan "${name}"? This stops future recurring invoices permanently.`)) {
      setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, status: "cancelled" } : s));
      showToast(`Subscription plan "${name}" cancelled.`, "warning");
    }
  };


  const handlePublishPost = (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast("Title and message body are required.", "error");
      return;
    }

    const newPost = {
      id: `post_${Date.now()}`,
      subscriptionId: selectedSubForPost.id,
      title: postTitle,
      content: postContent,
      imageUrl: postImage || "",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    saveAnnouncements([newPost, ...announcements]);
    showToast(`Broadcast published to ${selectedSubForPost.client}!`, "success");
    
    setPostTitle("");
    setPostContent("");
    setPostImage("");
    setShowPublishModal(false);
    setSelectedSubForPost(null);
  };


  const scopedClientInvoices = useMemo(() => {
    if (!historyClientName) return [];
    return invoices.filter(inv => inv.client === historyClientName);
  }, [invoices, historyClientName]);

  const scopedClientPayments = useMemo(() => {
    if (!historyClientName) return [];
    return payments.filter(p => p.client === historyClientName);
  }, [payments, historyClientName]);

  return (
    <div className="flex flex-col gap-6">

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Subscription Management</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Track recurring contract streams, cancel memberships, and publish subscriber announcements.
          </p>
        </div>

        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl gap-1 shadow-sm shrink-0">
          <button
            onClick={() => setCreatingPlan(true)}
            className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_box</span>
            Deploy Plan
          </button>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Normalized MRR</p>
          <h3 className="text-3xl font-black text-slate-950">{formatCurrency(totalMonthlyMRR)}</h3>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Monthly Recurring Base</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Active Agreements</p>
          <h3 className="text-3xl font-black text-emerald-600">
            {subscriptions.filter(s => s.status?.toLowerCase() === "active").length}
          </h3>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">out of {subscriptions.length} total</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Average Contract Life</p>
          <h3 className="text-3xl font-black text-indigo-600">8.6 Months</h3>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: "86%" }}></div>
          </div>
        </div>
      </div>

      {/* Plans Directory View */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
        
        {/* Status Filters */}
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Client Subscription Ledger</h4>
          <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-xl gap-1">
            {["all", "active", "suspended", "cancelled"].map(filterVal => (
              <button
                key={filterVal}
                onClick={() => setActivePlanFilter(filterVal)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activePlanFilter === filterVal ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {filterVal}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription cards layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubs.length > 0 ? (
            filteredSubs.map(sub => {
              const isSuspended = sub.status?.toLowerCase() === "suspended";
              const isCancelled = sub.status?.toLowerCase() === "cancelled";
              const isSubActive = sub.status?.toLowerCase() === "active";
              const subAnnouncements = announcements.filter(p => p.subscriptionId === sub.id);

              return (
                <div 
                  key={sub.id} 
                  className={`bg-white border rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-all ${
                    isSuspended ? "border-amber-200/80 bg-amber-50/10" : isCancelled ? "border-slate-200/60 bg-slate-50/20 opacity-90" : "border-slate-100"
                  }`}
                >
                  
                  {/* Plan Card Banner */}
                  <div className="w-full h-32 bg-slate-100 overflow-hidden relative flex-shrink-0">
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600">
                        <span className="material-symbols-outlined text-[32px] opacity-75">card_membership</span>
                        <span className="text-[8px] font-extrabold tracking-widest uppercase mt-1">STANDARD SERVICE BLOCK</span>
                      </div>
                    )}

                    {/* Status Pill Indicator overlay */}
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-200/50 flex items-center gap-1 shadow-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isSubActive ? "bg-emerald-500" : isSuspended ? "bg-amber-500" : "bg-slate-400"
                      }`}></span>
                      <span className={`text-[8px] font-black uppercase tracking-wider ${
                        isSubActive ? "text-emerald-800" : isSuspended ? "text-amber-800" : "text-slate-500"
                      }`}>
                        {sub.status || "active"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm leading-snug">{sub.name}</h5>
                      
                      <div className="mt-2.5 space-y-1 text-slate-500 font-semibold text-[10px]">
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
                          Client: <span className="font-bold text-slate-700">{sub.client}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">local_offer</span>
                          Tier: <span className="font-bold text-indigo-600 uppercase">{sub.tier || "starter"}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                          Billing cycle: <span className="font-bold text-slate-700 uppercase">{sub.cycle || "monthly"}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                          Trial Period: <span className="font-bold text-slate-700">{sub.trialDays || 0} Days</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center mt-1">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">COST BASE</span>
                        <span className="font-black text-slate-950 text-base">{formatCurrency(sub.price)}</span>
                      </div>

                      {/* Ledger History Button */}
                      <button
                        onClick={() => setHistoryClientName(sub.client)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 transition-colors text-[9px] font-bold"
                      >
                        Ledger History
                      </button>
                    </div>
                  </div>

                  {/* Operational Management controls inside Card */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPlan({ ...sub })}
                        className="text-slate-400 hover:text-slate-900 p-1 hover:bg-white rounded transition-all cursor-pointer"
                        title="Edit Plan Config"
                      >
                        <span className="material-symbols-outlined text-[15px] font-bold">edit</span>
                      </button>
                      
                      {isSubActive && (
                        <button
                          onClick={() => {
                            setSelectedSubForPost(sub);
                            setShowPublishModal(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-white rounded transition-all cursor-pointer"
                          title="Broadcast Announcement"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">campaign</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      {!isCancelled && (
                        <button
                          onClick={() => handleToggleSuspend(sub.id, isSuspended)}
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border cursor-pointer ${
                            isSuspended 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                          }`}
                        >
                          {isSuspended ? "Resume" : "Suspend"}
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelSubscription(sub.id, sub.name)}
                          className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-slate-200 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Announcement Posts under this Subscription */}
                  {subAnnouncements.length > 0 && (
                    <div className="p-3 bg-indigo-50/20 border-t border-slate-100 text-[10px] space-y-2">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Subscriber Messages</span>
                      {subAnnouncements.map(ann => (
                        <div key={ann.id} className="p-2.5 bg-white border border-slate-100 rounded-xl">
                          <div className="flex justify-between items-center gap-1">
                            <span className="font-bold text-slate-800">{ann.title}</span>
                            <span className="text-[7px] text-slate-400 font-bold shrink-0">{ann.date}</span>
                          </div>
                          <p className="text-slate-500 font-medium leading-relaxed mt-1">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-2xl text-xs">
              No subscription contracts match the selected status filter.
            </div>
          )}
        </div>

      </div>

      {/* ==================== CREATE SUBSCRIPTION MODAL ==================== */}
      {creatingPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">Initialize Subscription Plan</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Deploy recurring contract structures for client accounts.</p>
              </div>
              <button
                onClick={() => setCreatingPlan(false)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Scroll Body */}
            <form onSubmit={handleCreatePlanSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Plan Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Dedicated Development Services" 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Service Tier</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={createTier}
                    onChange={(e) => setCreateTier(e.target.value)}
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Cycle</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={createCycle}
                    onChange={(e) => setCreateCycle(e.target.value)}
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="quarterly">Quarterly Recurring</option>
                    <option value="yearly">Yearly Recurring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Price Cost (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Trial Period (Days)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={createTrial}
                    onChange={(e) => setCreateTrial(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Target Client Company</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={createClient}
                  onChange={(e) => setCreateClient(e.target.value)}
                >
                  {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Plan Logo Cover URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={createLogo}
                  onChange={(e) => setCreateLogo(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreatingPlan(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Initialize Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT SUBSCRIPTION MODAL ==================== */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">Modify Subscription Plan</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify parameters for active recurring schedule.</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Scroll Body */}
            <form onSubmit={handleEditPlanSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Plan Title</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Service Tier</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={editingPlan.tier || "starter"}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tier: e.target.value })}
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Cycle</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={editingPlan.cycle || "monthly"}
                    onChange={(e) => setEditingPlan({ ...editingPlan, cycle: e.target.value })}
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="quarterly">Quarterly Recurring</option>
                    <option value="yearly">Yearly Recurring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Price Cost (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Trial Period (Days)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={editingPlan.trialDays || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Target Client Company</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={editingPlan.client}
                  onChange={(e) => setEditingPlan({ ...editingPlan, client: e.target.value })}
                >
                  {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Plan Logo Cover URL (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingPlan.imageUrl || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, imageUrl: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ANNOUNCEMENT MODAL ==================== */}
      {showPublishModal && selectedSubForPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">Broadcast Announcement</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Publish community notice to "{selectedSubForPost.client}"</p>
              </div>
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedSubForPost(null);
                }}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePublishPost} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Broadcast Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Upcoming API Version Update" 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Message Body</label>
                <textarea 
                  required 
                  rows="4" 
                  placeholder="Draft your detailed announcement body here..." 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors resize-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Attachment Graphic URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={postImage}
                  onChange={(e) => setPostImage(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishModal(false);
                    setSelectedSubForPost(null);
                  }}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer outline-none"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BILLING HISTORY LEDGER MODAL ==================== */}
      {historyClientName && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">Ledger History: {historyClientName}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Audit transaction invoices and processed clearance logs.</p>
              </div>
              <button
                onClick={() => setHistoryClientName(null)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Invoices segment */}
              <div>
                <h5 className="font-black text-[9px] text-slate-400 uppercase tracking-wider mb-2.5">Invoiced Balances</h5>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                      <tr>
                        <th className="p-2.5 pl-3">Invoice ID</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5 pr-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scopedClientInvoices.length > 0 ? (
                        scopedClientInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 pl-3 font-bold text-slate-900">{inv.id}</td>
                            <td className="p-2.5 text-slate-500 font-semibold">{inv.date}</td>
                            <td className="p-2.5 font-black text-slate-950">{formatCurrency(inv.amount)}</td>
                            <td className="p-2.5 pr-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                inv.status === "paid" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}>{inv.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-5 text-center text-slate-400 italic">No invoices recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments Segment */}
              <div>
                <h5 className="font-black text-[9px] text-slate-400 uppercase tracking-wider mb-2.5">Stripe Processor Transactions</h5>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">
                      <tr>
                        <th className="p-2.5 pl-3">Transaction ID</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5 pr-3 text-right">Clearance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scopedClientPayments.length > 0 ? (
                        scopedClientPayments.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 pl-3 font-bold text-slate-900">{p.id}</td>
                            <td className="p-2.5 text-slate-500 font-semibold uppercase">{p.method || "card"}</td>
                            <td className="p-2.5 font-black text-slate-950">{formatCurrency(p.amount)}</td>
                            <td className="p-2.5 pr-3 text-right font-bold text-emerald-600">SUCCESS</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-5 text-center text-slate-400 italic">No payments processed via Stripe.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryClientName(null)}
                className="bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
              >
                Dismiss Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && checkoutInvoice && (
        <StripeCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
          onFailure={() => showToast("Subscription payment verification failed.", "error")}
          invoice={checkoutInvoice}
        />
      )}
    </div>
  );
};

export default SubscriptionsTab;
