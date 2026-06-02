import React, { useState } from "react";

const AdminClientsTab = ({
  clients,
  setClients,
  invoices,
  showToast
}) => {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTaxId, setFormTaxId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormCompany("");
    setFormEmail("");
    setFormPhone("");
    setFormTaxId("");
    setFormAddress("");
    setFormCurrency("INR");
    setFormNotes("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formCompany.trim() || !formEmail.trim() || !formName.trim()) {
      showToast("Company name, email, and POC name are required.", "warning");
      return;
    }

    if (editingId) {
      setClients(clients.map(c => c.id === editingId ? {
        ...c,
        name: formName,
        company: formCompany,
        email: formEmail,
        phone: formPhone,
        taxId: formTaxId,
        address: formAddress,
        currency: formCurrency,
        notes: formNotes
      } : c));
      showToast(`Client "${formCompany}" updated.`, "success");
    } else {
      const newClient = {
        id: `c_${Date.now()}`,
        name: formName,
        company: formCompany,
        email: formEmail,
        phone: formPhone,
        taxId: formTaxId,
        address: formAddress,
        currency: formCurrency,
        notes: formNotes,
        archived: false
      };
      setClients([newClient, ...clients]);
      showToast(`Client "${formCompany}" registered successfully.`, "success");
    }
    resetForm();
  };

  const handleEditClick = (c) => {
    setEditingId(c.id);
    setFormName(c.name || "");
    setFormCompany(c.company || "");
    setFormEmail(c.email || "");
    setFormPhone(c.phone || "");
    setFormTaxId(c.taxId || "");
    setFormAddress(c.address || "");
    setFormCurrency(c.currency || "INR");
    setFormNotes(c.notes || "");
  };

  const toggleArchive = (id, company) => {
    setClients(clients.map(c => c.id === id ? { ...c, archived: !c.archived } : c));
    showToast(`Client "${company}" status modified.`, "info");
  };

  // Filter clients
  const filtered = clients.filter(c => {
    const matchesSearch =
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesArchive = showArchived ? c.archived === true : !c.archived;
    return matchesSearch && matchesArchive;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Directory List & search controls */}
      <div className="lg:col-span-8 space-y-6">

        {/* Directory Controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search clients by name, POC, email..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showArchived
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {showArchived ? "View Active Directory" : "View Archived Clients"}
            </button>
          </div>
        </div>

        {/* Directory List Grid */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Client Roster</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              {filtered.length} client files
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-[40px] text-slate-300">people_outline</span>
              <h5 className="font-heading font-bold text-sm text-slate-800 mt-2">No Clients Registered</h5>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                No active directories match your criteria. Register new accounts using the creator dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(c => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/10"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-heading font-black text-slate-900 text-sm leading-snug">{c.company}</h5>
                        <span className="bg-indigo-50 border border-indigo-100 text-[9px] font-black px-2 py-0.5 rounded uppercase text-indigo-700">
                          {c.currency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">POC: {c.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{c.email}</p>
                    </div>

                    <div className="flex justify-between items-center gap-1 mt-1 border-t border-slate-100 pt-2.5">
                      <button
                        onClick={() => setSelectedClient(c)}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        View Profile
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                          title="Edit Details"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => toggleArchive(c.id, c.company)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                          title={c.archived ? "Restore Client" : "Archive Client"}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {c.archived ? "settings_backup_restore" : "archive"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Right side: Register / Edit Form OR Client Profile view */}
      <div className="lg:col-span-4 space-y-6">

        {/* Creator / Editor Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
            {editingId ? "Edit Client Registry" : "Register New Client"}
          </h4>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">POC Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Johnathan Doe"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">POC Email</label>
              <input
                type="email"
                required
                placeholder="poc@company.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 99988 77766"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST/VAT Tax ID</label>
              <input
                type="text"
                placeholder="27PIXEL7788A1Z9"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none"
                value={formTaxId}
                onChange={(e) => setFormTaxId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Billing Address</label>
              <textarea
                placeholder="Street address, City, Pin details"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none h-14 resize-none"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Currency</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold cursor-pointer outline-none text-slate-700"
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {editingId ? "Save Changes" : "Register Client"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Selected Profile Detailed View */}
        {selectedClient && (
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <div>
                <h5 className="font-heading font-black text-slate-900 text-sm">{selectedClient.company}</h5>
                <span className="text-[10px] text-slate-400 font-bold">Client Ledger Profile</span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-[10px] uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase">Point of Contact</span>
                <span className="text-slate-800">{selectedClient.name}</span>
              </div>

              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase">Contact Information</span>
                <span className="text-slate-800 block">{selectedClient.email}</span>
                <span className="text-slate-500 block text-[10px]">{selectedClient.phone || "No phone added"}</span>
              </div>

              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase">Billing Address</span>
                <p className="text-slate-700 text-[10px] leading-relaxed">{selectedClient.address || "No address supplied."}</p>
              </div>

              {/* History stats */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-600 space-y-1">
                <span className="block font-black text-slate-800 uppercase text-[8px] mb-1">Activity Summaries</span>
                <div className="flex justify-between">
                  <span>Total Invoiced</span>
                  <span className="font-bold text-slate-900">
                    ₹{invoices.filter(i => i.client === selectedClient.company).reduce((sum, current) => sum + current.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Invoices</span>
                  <span className="font-bold text-slate-900">
                    {invoices.filter(i => i.client === selectedClient.company && i.status !== "paid").length} counts
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminClientsTab;
