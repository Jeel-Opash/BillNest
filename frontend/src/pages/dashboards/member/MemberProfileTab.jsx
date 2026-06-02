import React, { useState } from "react";

const MemberProfileTab = ({
  user,
  showToast
}) => {

  const [profileName, setProfileName] = useState(user?.name || "Amit Kumar");
  const [profileEmail, setProfileEmail] = useState(user?.email || "amit@codecraft.com");


  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* Left side: Credentials form */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <div>
            <h4 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Account Credentials</h4>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Configure system credentials</span>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-black text-indigo-700 uppercase tracking-wider">
            {user?.role?.toUpperCase() || "MEMBER"} PRIVILEGES
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          {/* Mock Avatar initials uploader */}
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
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs font-semibold outline-none text-slate-700"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Work Email</label>
              <input
                type="email"
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none text-slate-500 cursor-not-allowed"
                value={profileEmail}
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

      {/* Right side: Password Change */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
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

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            Modify Password
          </button>
        </form>
      </div>

    </div>
  );
};

export default MemberProfileTab;
