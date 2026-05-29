import React from "react";

const TeamTab = ({
  teamList,
  setTeamList,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  handleSendInvite,
  showToast
}) => {
  const handleDeleteTeammate = (id, name) => {
    setTeamList(teamList.filter(t => t.id !== id));
    showToast(`Teammate ${name} removed from workspace.`, "info");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-heading text-2xl font-bold text-slate-900">Team Management</h3>
        <p className="text-slate-500 text-sm mt-1">Oversee colleague privileges and securely invite new partners to your workspace. Maintain control with granular access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-heading text-lg font-bold text-slate-900">Active Workspace Teammates</h4>
            <button className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              FILTER
            </button>
          </div>
          
          <div className="space-y-4">
            {teamList.map(t => {
              const shortName = t.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase();
              return (
                <div key={t.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200/80 transition-all duration-150">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {shortName}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{t.name}</h5>
                      <p className="text-xs text-slate-500">{t.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end flex-1 sm:flex-initial">
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">PRIVILEGE ROLE</span>
                      <select
                        value={t.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setTeamList(teamList.map(item => item.id === t.id ? { ...item, role: newRole } : item));
                          showToast(`Role for ${t.name} updated to ${newRole.toUpperCase()}.`, "success");
                        }}
                        className="bg-white border border-slate-200 focus:border-indigo-600 rounded-lg py-1 px-2.5 text-xs font-semibold outline-none cursor-pointer text-slate-700 transition-colors shadow-sm"
                      >
                        <option value="admin">Workspace Admin</option>
                        <option value="member">Workspace Member</option>
                        <option value="read_only">Read-Only Observer</option>
                      </select>
                    </div>
                    <div className="text-left sm:text-right min-w-[70px]">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">STATUS</span>
                      <span className={`inline-flex items-center gap-1.5 font-bold capitalize ${
                        t.status === "active" ? "text-emerald-700" : "text-amber-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                        }`}></span>
                        {t.status}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteTeammate(t.id, t.name)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto sm:ml-0"
                      title="Remove Teammate"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
          <div>
            <h4 className="font-heading text-lg font-bold text-slate-900">Invite Workspace Colleague</h4>
            <p className="text-slate-400 text-xs mt-1">Scale your operations with trusted partners.</p>
          </div>
          
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Teammate Gmail Account</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                <input type="email" required placeholder="colleague@gmail.com" className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl py-2.5 pl-9 pr-3.5 text-sm font-semibold transition-all outline-none" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1">Assign Privilege Role</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">badge</span>
                <select className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl py-2.5 pl-9 pr-3.5 text-sm font-semibold transition-all outline-none appearance-none cursor-pointer" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="admin">Workspace Admin</option>
                  <option value="member">Workspace Member</option>
                  <option value="read_only">Read-Only Observer</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">send</span>
              Send Secure Invite
            </button>
          </form>

          <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl flex items-start gap-2 mt-2">
            <span className="material-symbols-outlined text-indigo-600 text-sm mt-0.5">info</span>
            <p className="text-[11px] text-indigo-800 font-semibold leading-relaxed">
              Invited colleagues will receive a high-security encrypted link to seamlessly claim their new role. Access is strictly audited.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
          <div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 mb-3">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <h5 className="font-bold text-slate-900 text-sm mb-1.5">Audit History</h5>
            <p className="text-slate-400 text-xs leading-relaxed">
              Review all teammate actions and permission changes from the last 90 days.
            </p>
          </div>
          <button onClick={() => showToast("Navigating to audit logs...", "info")} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold text-left flex items-center gap-0.5 w-fit">
            VIEW LOGS &gt;
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
          <div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 mb-3">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            </div>
            <h5 className="font-bold text-slate-900 text-sm mb-1.5">Bulk Permissions</h5>
            <p className="text-slate-400 text-xs leading-relaxed">
              Update access levels for multiple colleagues simultaneously across all projects.
            </p>
          </div>
          <button onClick={() => showToast("Bulk permission manager is an Enterprise feature.", "info")} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold text-left flex items-center gap-0.5 w-fit">
            MANAGE BULK &gt;
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
          <div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 mb-3">
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
            <h5 className="font-bold text-slate-900 text-sm mb-1.5">Connected Roles</h5>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sync your team hierarchy directly with Slack or Discord workspace roles.
            </p>
          </div>
          <button onClick={() => showToast("Teammate integration sync setup...", "info")} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold text-left flex items-center gap-0.5 w-fit">
            SETUP SYNC &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamTab;
