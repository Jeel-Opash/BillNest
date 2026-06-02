import React, { useState } from "react";

const ReadOnlyClientsTab = ({
  clients,
  invoices
}) => {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = clients.filter(c => 
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left Column: Client roster list */}
      <div className="lg:col-span-8 space-y-6">

        {/* Read-Only Safeguard Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-3 select-none">
          <span className="material-symbols-outlined text-[20px] text-slate-500 mt-0.5">lock_outline</span>
          <div>
            <h5 className="font-heading text-xs font-black text-slate-700 uppercase tracking-wide">Auditor Read-Only Roster Constraints</h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
              Your account has **Read-Only Observer** permissions. You can audit active client listings, tax metrics, and historical invoices. Registering new companies, modifying POCs, or deleting client database files is locked.
            </p>
          </div>
        </div>

        {/* Search controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search auditor client directories..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Locked new client indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-transparent rounded-xl text-slate-400 text-xs font-bold cursor-not-allowed select-none"
            title="Registering accounts locked for Read-Only observers"
          >
            <span className="material-symbols-outlined text-[16px]">add_lock</span>
            Register Client
          </div>
        </div>

        {/* Clients Directory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Clients Directory</h4>
            <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {filteredClients.length} accounts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map(c => {
              const isSelected = selectedClient?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/10"
                      : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                  }`}
                  onClick={() => setSelectedClient(c)}
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

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1 select-none">
                    <span className="text-indigo-600 text-[10px] font-extrabold flex items-center gap-0.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Inspect Ledger
                    </span>

                    {/* Locked warning icon */}
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Read-Only
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Column: Profile & Invoice inspections */}
      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[300px]">
        {selectedClient ? (
          <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <div>
                <h5 className="font-heading font-black text-slate-900 text-sm">{selectedClient.company}</h5>
                <span className="text-[10px] text-slate-400 font-bold">Client Auditor Profile</span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Corporate Details</span>
                <p className="text-slate-800">Primary POC: {selectedClient.name}</p>
                <p className="text-slate-500 mt-0.5">{selectedClient.email}</p>
                <p className="text-slate-500 mt-0.5">{selectedClient.phone || "No phone listed"}</p>
              </div>

              <div>
                <span className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Tax Identification Details</span>
                <p className="text-slate-800">GST/VAT Registered: <strong className="text-indigo-600">{selectedClient.taxId || "N/A"}</strong></p>
                <p className="text-slate-400 text-[10px] mt-0.5">Billing: {selectedClient.address || "No address listed"}</p>
              </div>

              {/* Invoiced sum cards */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-600 space-y-1.5">
                <span className="block font-black text-slate-800 uppercase text-[8px] mb-1">Ledger Audits</span>
                <div className="flex justify-between">
                  <span>Gross Revenue Mapped</span>
                  <span className="font-bold text-slate-900">
                    ₹{invoices.filter(i => i.client === selectedClient.company && i.status === "paid").reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding invoices</span>
                  <span className="font-bold text-slate-900">
                    {invoices.filter(i => i.client === selectedClient.company && i.status !== "paid").length} items
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs font-semibold">
            Select a client from the directory to review their detailed corporate profile, tax settings, active subscription logs, and generated revenue history.
          </div>
        )}
      </div>

    </div>
  );
};

export default ReadOnlyClientsTab;
