import React, { useState } from "react";

const SettingsTab = ({
  orgSettings,
  setOrgSettings,
  showToast
}) => {
  const [localSettings, setLocalSettings] = useState({ ...orgSettings });
  const [logoPreview, setLogoPreview] = useState(orgSettings.logo || "");

  // Handle Logo upload simulation
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setLocalSettings(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setOrgSettings(localSettings);
    showToast("Organization and billing parameters saved successfully.", "success");
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Organization Profile & Billing Presets</h3>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Configure multi-tenant brand identifiers, default billing intervals, legal tax registries, and outgoing invoice visual assets.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Organization & Billing settings panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Panel 1: Organization Information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">domain</span>
              <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Organization Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              
              {/* Company Name */}
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={localSettings.name || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Corporate Address</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={localSettings.address || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">GST/VAT Tax Number</label>
                <input
                  type="text"
                  required
                  placeholder="24AAAAA1111A1Z1"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={localSettings.gstNumber || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, gstNumber: e.target.value })}
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Operational Timezone</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={localSettings.timezone || "Asia/Kolkata (IST)"}
                  onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="America/New_York (EST)">America/New_York (EST - UTC-5:00)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT - UTC+0:00)</option>
                  <option value="Europe/Paris (CET)">Europe/Paris (CET - UTC+1:00)</option>
                  <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT - UTC+8:00)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Base Currency</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={localSettings.currency || "INR"}
                  onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Panel 2: Billing Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">receipt_long</span>
              <h4 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">Billing Settings</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              
              {/* Invoice Prefix */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  required
                  placeholder="INV"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={localSettings.invoicePrefix || ""}
                  onChange={(e) => setLocalSettings({ ...localSettings, invoicePrefix: e.target.value })}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Payment Terms</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  value={localSettings.paymentTerms || "Due on Receipt"}
                  onChange={(e) => setLocalSettings({ ...localSettings, paymentTerms: e.target.value })}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="NET 15">NET 15 days</option>
                  <option value="NET 30">NET 30 days</option>
                  <option value="NET 60">NET 60 days</option>
                </select>
              </div>

              {/* Tax Configuration */}
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Default Tax Configuration (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={localSettings.taxRate ?? 18}
                  onChange={(e) => setLocalSettings({ ...localSettings, taxRate: parseInt(e.target.value) || 0 })}
                />
              </div>

            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-start">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">save</span>
              Save Organization Settings
            </button>
          </div>

        </div>

        {/* Right column: Branding Visual Identity card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Visual Identity / Logo Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2 self-start border-b border-slate-50 pb-2 w-full">
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">palette</span>
              <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Branding & Logo</h4>
            </div>

            {/* Logo box */}
            <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <span className="material-symbols-outlined text-[30px]">image</span>
                  <span className="text-[8px] font-bold uppercase mt-1">No Logo</span>
                </div>
              )}
            </div>

            <div>
              <h5 className="font-heading text-xs font-bold text-slate-900">Workspace Logo</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal px-2">
                This asset will be embedded directly onto generated invoices and client checkouts.
              </p>
            </div>

            <label className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer block text-center">
              Upload Custom Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>

          {/* Tenant Status cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[9px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Compliance
              </div>
              <span className="text-slate-900 font-black text-sm">Verified</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[9px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Security
              </div>
              <span className="text-slate-900 font-black text-sm">Standard 2FA</span>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
};

export default SettingsTab;
