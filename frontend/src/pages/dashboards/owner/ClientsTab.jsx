import React, { useState, useMemo } from "react";

const formatCurrency = (val, currency = "INR") => {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "EUR" ? "en-DE" : "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);
};

const ClientsTab = ({
  clients = [],
  setClients,
  invoices = [],
  newClientName,
  setNewClientName,
  newClientCompany,
  setNewClientCompany,
  newClientEmail,
  setNewClientEmail,
  newClientPhone,
  setNewClientPhone,
  newClientTaxId,
  setNewClientTaxId,
  newClientCurrency,
  setNewClientCurrency,
  newClientAddress,
  setNewClientAddress,
  handleAddClient,
  showToast
}) => {

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  const [selectedProfileClient, setSelectedProfileClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);


  const getClientRevenue = (companyName) => {
    return invoices
      ?.filter(inv => inv.client === companyName && inv.status?.toLowerCase() === "paid")
      ?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  };


  const getClientInvoiceCount = (companyName) => {
    return invoices?.filter(inv => inv.client === companyName)?.length || 0;
  };


  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const company = c.company || "";
      const name = c.name || "";
      const email = c.email || "";
      
      const matchesSearch = 
        company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());

      const status = c.status || "active";
      const matchesStatus = 
        statusFilter === "all" || 
        status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);


  const activeCount = useMemo(() => {
    return clients.filter(c => (c.status || "active").toLowerCase() === "active").length;
  }, [clients]);

  const totalCalculatedRevenue = useMemo(() => {
    return invoices
      ?.filter(inv => inv.status?.toLowerCase() === "paid")
      ?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  }, [invoices]);


  const handleDeleteClick = (clientId, companyName) => {
    if (window.confirm(`Are you sure you want to remove client "${companyName}"? This will untether their profile data.`)) {
      setClients(clients.filter(c => c.id !== clientId));
      showToast(`Client "${companyName}" deleted successfully.`, "info");
      if (selectedProfileClient?.id === clientId) {
        setSelectedProfileClient(null);
      }
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingClient.company || !editingClient.name || !editingClient.email) {
      showToast("Company Name, Contact Person, and Email are required.", "error");
      return;
    }

    setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
    showToast(`Client "${editingClient.company}" updated successfully.`, "success");
    setEditingClient(null);
    

    if (selectedProfileClient?.id === editingClient.id) {
      setSelectedProfileClient(editingClient);
    }
  };


  const [newClientStatus, setNewClientStatus] = useState("active");
  const [newClientNotes, setNewClientNotes] = useState("");

  const handleCustomAddClient = (e) => {
    e.preventDefault();
    if (!newClientCompany || !newClientName || !newClientEmail) {
      showToast("Please enter Company, Contact, and Email.", "error");
      return;
    }

    const newClientObj = {
      id: `c_${Date.now()}`,
      company: newClientCompany,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone || "",
      taxId: newClientTaxId || "",
      address: newClientAddress || "",
      currency: newClientCurrency || "INR",
      status: newClientStatus,
      notes: newClientNotes || ""
    };

    setClients([...clients, newClientObj]);
    

    setNewClientCompany("");
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientTaxId("");
    setNewClientAddress("");
    setNewClientNotes("");
    setNewClientStatus("active");
    
    showToast(`Client "${newClientObj.company}" created successfully!`, "success");
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Workspace Client Registry</h3>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Monitor dynamic revenue mapping, customize tax entities, and perform workspace administration.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Total Active Clients</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-950">{activeCount}</h3>
            <span className="text-[10px] text-slate-400 font-bold">out of {clients.length} total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Total Realized Revenue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-600">{formatCurrency(totalCalculatedRevenue)}</h3>
            <span className="text-[10px] text-slate-400 font-bold">Cleared Ledger</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Retention Telemetry</p>
          <h3 className="text-3xl font-black text-indigo-600">98.4%</h3>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: "98.4%" }}></div>
          </div>
        </div>
      </div>

      {/* Workspace search, filters and details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Client List Operations (8 columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-50">
            <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Active Workspace Clients</h4>
            
            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial min-w-[160px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search clients..."
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
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Client Cards List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.length > 0 ? (
              filteredClients.map(c => {
                const shortName = (c.company || "Unnamed")
                  .split(" ")
                  .map(w => w.charAt(0))
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                
                const isClientActive = (c.status || "active").toLowerCase() === "active";
                const clientRevenue = getClientRevenue(c.company);

                return (
                  <div
                    key={c.id}
                    className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Company Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                        {shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm truncate max-w-[160px] md:max-w-[220px]">{c.company}</h5>
                          <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isClientActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${isClientActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                            {c.status || "active"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium truncate max-w-[240px]">
                          POC: {c.name} • {c.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-row items-center gap-5 text-xs w-full sm:w-auto justify-between sm:justify-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right shrink-0">
                        <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">LIFETIME PAID</span>
                        <span className="font-black text-slate-950">{formatCurrency(clientRevenue, c.currency)}</span>
                      </div>
                      
                      {/* Action buttons visible on hover or mobile */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedProfileClient(c)}
                          className="bg-white border border-slate-200/80 hover:border-slate-300 text-slate-600 hover:text-slate-950 p-1.5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="View Client Profile"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">visibility</span>
                        </button>
                        <button
                          onClick={() => setEditingClient({ ...c })}
                          className="bg-white border border-slate-200/80 hover:border-slate-300 text-slate-600 hover:text-slate-950 p-1.5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Edit Client Details"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c.id, c.company)}
                          className="bg-white border border-slate-200/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Delete Client"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-2xl text-xs">
                No clients match your filter criteria or search query.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Add New Client (4 columns) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Add New Client</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Register a new tax entity workspace partner.</p>
          </div>

          <form onSubmit={handleCustomAddClient} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Acme Corp" 
                className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                value={newClientCompany} 
                onChange={(e) => setNewClientCompany(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Contact Person</label>
              <input 
                type="text" 
                required 
                placeholder="POC Full Name" 
                className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                value={newClientName} 
                onChange={(e) => setNewClientName(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="finance@company.com" 
                className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                value={newClientEmail} 
                onChange={(e) => setNewClientEmail(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+91 99000 12345" 
                  className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Currency</label>
                <select 
                  className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer" 
                  value={newClientCurrency} 
                  onChange={(e) => setNewClientCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST / VAT Registration Number</label>
              <input 
                type="text" 
                placeholder="e.g. 24ABCDE1234F1Z5" 
                className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                value={newClientTaxId} 
                onChange={(e) => setNewClientTaxId(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Address</label>
              <input 
                type="text" 
                placeholder="City, State, Zip" 
                className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                value={newClientAddress} 
                onChange={(e) => setNewClientAddress(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status</label>
                <select 
                  className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer" 
                  value={newClientStatus} 
                  onChange={(e) => setNewClientStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Internal Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. Key account" 
                  className="w-full bg-slate-50/50 border border-slate-200/85 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold transition-all outline-none" 
                  value={newClientNotes} 
                  onChange={(e) => setNewClientNotes(e.target.value)} 
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm outline-none cursor-pointer">
              Add Partner Workspace
            </button>
          </form>
        </div>

      </div>

      {/* ==================== VIEW PROFILE MODAL ==================== */}
      {selectedProfileClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                  {(selectedProfileClient.company || "U")
                    .split(" ")
                    .map(w => w.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold text-slate-900 leading-tight">{selectedProfileClient.company}</h4>
                  <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border mt-1.5 ${
                    (selectedProfileClient.status || "active").toLowerCase() === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {(selectedProfileClient.status || "active")}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedProfileClient(null)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Client Profile details grid */}
              <div>
                <h5 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest mb-3.5">Client Details & Registry Profile</h5>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Contact Person</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Billing Email</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phone Number</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.phone || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Preferred Currency</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.currency || "INR"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">GST/VAT Number</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.taxId || "Unregistered"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Billing Address</p>
                    <p className="font-bold text-slate-800">{selectedProfileClient.address || "No billing address"}</p>
                  </div>
                  {selectedProfileClient.notes && (
                    <div className="col-span-2 pt-2 border-t border-slate-200/50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Internal Notes</p>
                      <p className="font-medium text-slate-600 leading-relaxed italic">"{selectedProfileClient.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Metrics */}
              <div>
                <h5 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest mb-3.5">Financial Summary & Lifespan Value</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
                    <p className="text-emerald-800 text-[10px] font-black uppercase tracking-wider">Total Revenue Generated</p>
                    <h3 className="text-xl font-black text-emerald-950 mt-2">
                      {formatCurrency(getClientRevenue(selectedProfileClient.company), selectedProfileClient.currency)}
                    </h3>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between">
                    <p className="text-indigo-800 text-[10px] font-black uppercase tracking-wider">Invoices Issued</p>
                    <h3 className="text-xl font-black text-indigo-950 mt-2">
                      {getClientInvoiceCount(selectedProfileClient.company)} invoices
                    </h3>
                  </div>
                </div>
              </div>

              {/* Invoice List scoped to this client */}
              <div>
                <h5 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest mb-3.5">Client Billing History</h5>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.filter(inv => inv.client === selectedProfileClient.company).length > 0 ? (
                        invoices
                          .filter(inv => inv.client === selectedProfileClient.company)
                          .map((inv, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{inv.id}</td>
                              <td className="p-3 font-semibold text-slate-500">{inv.date}</td>
                              <td className="p-3 font-black text-slate-950">{formatCurrency(inv.amount, selectedProfileClient.currency)}</td>
                              <td className="p-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  inv.status?.toLowerCase() === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : inv.status?.toLowerCase() === "sent"
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : inv.status?.toLowerCase() === "overdue"
                                    ? "bg-rose-50 text-rose-700 border-rose-100"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>{inv.status}</span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-400 font-semibold italic">No invoices drafted or processed for this client.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setEditingClient({ ...selectedProfileClient });
                  setSelectedProfileClient(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
              >
                Edit Client Profile
              </button>
              <button
                onClick={() => setSelectedProfileClient(null)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none"
              >
                Dismiss Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT CLIENT MODAL ==================== */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-base font-bold text-slate-900">Edit Client Registry</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Modify database details for "{editingClient.company}"</p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-950 p-2 rounded-xl hover:bg-slate-50 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingClient.company}
                  onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Point of Contact</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={editingClient.phone || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Currency</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={editingClient.currency || "INR"}
                    onChange={(e) => setEditingClient({ ...editingClient, currency: e.target.value })}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST / VAT Number</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingClient.taxId || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, taxId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Address</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                  value={editingClient.address || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                    value={editingClient.status || "active"}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Notes</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none transition-colors"
                    value={editingClient.notes || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer Controls inside the Form */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
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

    </div>
  );
};

export default ClientsTab;
