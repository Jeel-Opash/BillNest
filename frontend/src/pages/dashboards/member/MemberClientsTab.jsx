import React, { useState } from "react";

const MemberClientsTab = ({
  clients,
  setClients,
  invoices,
  showToast
}) => {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);


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

  const handleSaveClient = (e) => {
    e.preventDefault();
    if (!formCompany.trim() || !formEmail.trim() || !formName.trim()) {
      showToast("Company, email, and POC name are required fields.", "warning");
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
      showToast(`Assigned client "${formCompany}" details updated by Member.`, "success");
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
        assignedBy: "Member Workspace Self"
      };
      setClients([newClient, ...clients]);
      showToast(`New client "${formCompany}" registered successfully.`, "success");
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

  const filteredClients = clients.filter(c => 
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Directory list */}
      <div className="lg:col-span-8 space-y-6">

        {/* Safeguard banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
          <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Workspace Member Constraints</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
              You are logged in with **Member** credentials. Members have authority to register and edit client points-of-contact. However, deleting client accounts or modifying global organization billing settings is restricted to Owner/Admin roles.
            </p>
          </div>
        </div>

        {/* Directory Controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search assigned client roster..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Client Roster list */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">My Assigned Roster</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredClients.length} clients
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400">
                No matching accounts mapped to your credential index.
              </div>
            ) : (
              filteredClients.map(c => {
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
                        <span className="bg-indigo-50 border border-indigo-100 text-[9px] font-black px-2.5 py-0.5 rounded uppercase text-indigo-700">
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
                        View History
                      </button>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                          title="Edit Details"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        
                        {/* Disabled Deletion control with lock visual indicator */}
                        <div
                          className="w-7 h-7 rounded-lg bg-slate-100 border border-transparent text-slate-400 flex items-center justify-center select-none"
                          title="Deletion locked for Workspace Members"
                        >
                          <span className="material-symbols-outlined text-[15px]">lock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right side: Editor Form OR Client History inspect */}
      <div className="lg:col-span-4 space-y-6">

        {/* Creator / Editor panel */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
            {editingId ? "Modify Client contact" : "Register New Account"}
          </h4>

          <form onSubmit={handleSaveClient} className="space-y-3.5">
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
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {editingId ? "Save Contact Details" : "Register Client"}
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

        {/* Selected History Inspector */}
        {selectedClient && (
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <div>
                <h5 className="font-heading font-black text-slate-900 text-sm">{selectedClient.company}</h5>
                <span className="text-[10px] text-slate-400 font-bold">Client History Ledger</span>
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
                <span className="block text-[8px] text-slate-400 font-bold uppercase">Primary POC</span>
                <span className="text-slate-800">{selectedClient.name}</span>
              </div>

              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase">Billing Details</span>
                <span className="text-slate-800 block">{selectedClient.email}</span>
                <span className="text-slate-500 block text-[10px]">{selectedClient.phone || "No phone added"}</span>
                <span className="text-slate-400 block text-[10px]">Tax ID: {selectedClient.taxId || "Not added"}</span>
              </div>

              {/* History checklist */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-600 space-y-1">
                <span className="block font-black text-slate-800 uppercase text-[8px] mb-1">Invoice Metrics Scoped</span>
                <div className="flex justify-between">
                  <span>Assigned Invoiced Sum</span>
                  <span className="font-bold text-slate-900">
                    ₹{invoices.filter(i => i.client === selectedClient.company).reduce((sum, current) => sum + current.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Invoices</span>
                  <span className="font-bold text-slate-900">
                    {invoices.filter(i => i.client === selectedClient.company && i.status !== "paid").length} invoices
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

export default MemberClientsTab;
