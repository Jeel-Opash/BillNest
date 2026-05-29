import React from "react";

const ClientsTab = ({
  clients,
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
  handleAddClient
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-bold text-slate-900">Client Management</h3>
          <p className="text-slate-500 text-sm mt-1">Manage relationships and workspace access for your partners.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Active Clients</p>
              <span className="text-emerald-600 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded-md">+12.5%</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{clients.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Monthly Workspace Billing</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">₹{(clients.length * 45000).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Retention Rate</p>
            <h3 className="text-3xl font-bold text-indigo-600 tracking-tight mb-2">98.2%</h3>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "98.2%" }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
          <h4 className="font-heading text-lg font-bold text-slate-900">Active Workspace Clients</h4>
          <div className="space-y-4">
            {clients.map(c => {
              const shortName = c.company.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase();
              return (
                <div key={c.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200/80 transition-all duration-150">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {shortName}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{c.company}</h5>
                      <p className="text-xs text-slate-500">POC: {c.name} | {c.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">PLAN</span>
                      <span className="font-semibold text-slate-700">Unlimited ({c.currency})</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">STATUS</span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
          <h4 className="font-heading text-lg font-bold text-slate-900">Add New Client</h4>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Company Name</label>
              <input type="text" required placeholder="e.g. Acme Corp" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientCompany} onChange={(e) => setNewClientCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Point of Contact</label>
              <input type="text" required placeholder="Full Name" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Email Address</label>
              <input type="email" required placeholder="contact@company.com" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Phone Number</label>
              <input type="text" placeholder="+91 999 888 776" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">Currency</label>
                <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientCurrency} onChange={(e) => setNewClientCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1">City/Address</label>
                <input type="text" placeholder="Address" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Tax ID / GST Number</label>
              <input type="text" placeholder="e.g. 24ABCDE1234" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-sm font-semibold transition-all outline-none" value={newClientTaxId} onChange={(e) => setNewClientTaxId(e.target.value)} />
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md mt-2">
              Create Workspace
            </button>
          </form>

          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex items-start gap-2 mt-2">
            <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">info</span>
            <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
              New clients will automatically receive a secure onboarding invite via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsTab;
