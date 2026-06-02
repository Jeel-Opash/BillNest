import React, { useState } from "react";

const AdminProfileTab = ({
  user,
  showToast
}) => {
  // Form parameters
  const [profileName, setProfileName] = useState(user?.name || "Priya Sharma");
  const [profileEmail, setProfileEmail] = useState(user?.email || "priya@codecraft.com");

  // Password parameters
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification Preferences
  const [prefs, setPrefs] = useState({
    success: true,
    failed: true,
    renewals: true,
    invites: false
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast("Profile credentials updated successfully.", "success");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("Please provide all password parameters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match confirm parameters.", "error");
      return;
    }
    showToast("Workspace account password updated securely.", "success");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const togglePref = (key) => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Profile Credentials */}
      <div className="lg:col-span-7 space-y-6">

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <div>
              <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Account Credentials</h4>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Configure system credentials</span>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-black text-indigo-700 uppercase tracking-wider">
              {user?.role?.toUpperCase() || "ADMIN"} PRIVILEGES
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Mock Avatar Uploader */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-2xl shadow-md border border-indigo-100">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800">Avatar initials</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">System generated based on registration profile</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Full User Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none text-slate-700"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none text-slate-700"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
            >
              Update Credentials
            </button>
          </form>
        </div>

        {/* Password Modifier */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
            Security Password Modification
          </h4>

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2 text-xs font-semibold outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
            >
              Modify Password
            </button>
          </form>
        </div>

      </div>

      {/* Right side: Notification Telemetry Subscriptions */}
      <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
          Telemetry Configurations
        </h4>

        <div className="space-y-4">
          {[
            { key: "success", label: "Payment Success Dispatches", desc: "Send triggers when client invoices successfully resolve." },
            { key: "failed", label: "Failed Gateways Alerts", desc: "Notify immediately when client billing retry cycles error." },
            { key: "renewals", label: "Subscription Renewals Triggers", desc: "Fires 3 days prior to recurring subscription cycle dispatches." },
            { key: "invites", label: "Teammate Invitations Status", desc: "Trace teammate join accepts and pending workspace registrations." }
          ].map(pref => (
            <div key={pref.key} className="flex justify-between items-start gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-800 leading-snug">{pref.label}</span>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block leading-normal">{pref.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => togglePref(pref.key)}
                className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-all duration-200 cursor-pointer ${
                  prefs[pref.key] ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm"></span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminProfileTab;
