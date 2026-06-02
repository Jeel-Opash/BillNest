import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

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
  const { addLocalInvitation, user } = useAuth();
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [showWorkspacesDropdown, setShowWorkspacesDropdown] = useState(false);

  const workspaces = useMemo(() => {
    try {
      const saved = localStorage.getItem("bn_workspaces");
      let list = saved ? JSON.parse(saved) : [];

      list = list.map(w => {
        if (typeof w === "string") {
          return { _id: w, name: "Workspace (" + w.substring(0, 5) + "...)" };
        }
        if (w && typeof w === "object" && !w.name) {
          return { ...w, name: "Workspace (" + (w._id || "").substring(0, 5) + "...)" };
        }
        return w;
      }).filter(Boolean);

      if (user?.organization) {
        const orgObj = typeof user.organization === "string"
          ? { _id: user.organization, name: "Active Workspace" }
          : {
            _id: user.organization._id || "default",
            name: user.organization.name || "Active Workspace"
          };

        if (!list.some(w => w._id === orgObj._id)) {
          list.unshift(orgObj);
        }
      }

      if (list.length <= 1) {
        list = [
          { _id: "default", name: "BillNest Main Organization (Active)" },
          { _id: "w_design", name: "Design & Creative Lab" },
          { _id: "w_marketing", name: "Global Marketing Ventures" },
          { _id: "w_retail", name: "Asia-Pacific Retail Operations" }
        ];
        localStorage.setItem("bn_workspaces", JSON.stringify(list));
      }

      return list;    
    } catch (e) {
      console.error(e);
      return [
        { _id: "default", name: "BillNest Main Organization (Active)" },
        { _id: "w_design", name: "Design & Creative Lab" },
        { _id: "w_marketing", name: "Global Marketing Ventures" },
        { _id: "w_retail", name: "Asia-Pacific Retail Operations" }
      ];
    }
  }, [user]);

  useEffect(() => {
    if (user?.organization) {
      const orgId = typeof user.organization === "string"
        ? user.organization
        : (user.organization._id || "default");
      setSelectedWorkspaces([orgId]);
    } else if (workspaces.length > 0) {
      setSelectedWorkspaces([workspaces[0]._id]);
    }
  }, [user, workspaces]);

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    if (selectedWorkspaces.length === 0) {
      showToast("Please select at least one workspace.", "error");
      return;
    }

    const newInviteObj = {
      id: `t${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending"
    };
    setTeamList([...teamList, newInviteObj]);

    const selectedOrgs = workspaces.filter(w => selectedWorkspaces.includes(w._id));
    selectedOrgs.forEach(org => {
      addLocalInvitation(inviteEmail, inviteRole, org.name);
    });

    setInviteEmail("");
    showToast(`Workspace Invite sent to ${inviteEmail} for ${selectedOrgs.length} workspace(s)!`, "success");
  };

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
                      <span className={`inline-flex items-center gap-1.5 font-bold capitalize ${t.status === "active" ? "text-emerald-700" : "text-amber-700"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
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

          <form onSubmit={handleLocalSubmit} className="space-y-4">
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

            <div>
              <label className="block text-slate-500 text-xs font-semibold mb-1.5">Target Workspace(s)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWorkspacesDropdown(!showWorkspacesDropdown)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 hover:border-indigo-500/50 rounded-xl py-2.5 px-3.5 text-xs font-semibold flex items-center justify-between transition-all outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">lan</span>
                    <span>
                      {selectedWorkspaces.length === 0
                        ? "Select target workspace(s)"
                        : selectedWorkspaces.length === workspaces.length
                          ? "All Workspaces Selected"
                          : `${selectedWorkspaces.length} Workspace(s) Selected`}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">
                    {showWorkspacesDropdown ? "arrow_drop_up" : "arrow_drop_down"}
                  </span>
                </button>

                {showWorkspacesDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowWorkspacesDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-2 space-y-1 animate-fade-in">
                      {workspaces.map((org) => {
                        const isChecked = selectedWorkspaces.includes(org._id);
                        return (
                          <label
                            key={org._id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer select-none ${isChecked ? "bg-indigo-50/40" : "hover:bg-slate-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedWorkspaces(selectedWorkspaces.filter(id => id !== org._id));
                                } else {
                                  setSelectedWorkspaces([...selectedWorkspaces, org._id]);
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-xs font-bold ${isChecked ? "text-indigo-800" : "text-slate-700"}`}>
                              {org.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
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

    </div>
  );
};

export default TeamTab;
