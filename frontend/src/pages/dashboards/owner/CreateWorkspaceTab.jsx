import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CreateWorkspaceTab = () => {
  const { createWorkspace, addLocalInvitation, localInvitations, simulateLoginAs, showToast } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [accentColor, setAccentColor] = useState("indigo");
  const [planLevel, setPlanLevel] = useState("pro");

  const [adminEmail, setAdminEmail] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Keep track of the active provisioned workspace to show in the invitation receiver panel
  const [lastProvisionedOrg, setLastProvisionedOrg] = useState(null);

  const handleProvisionWorkspace = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) {
      showToast("Please enter a valid organization name.", "error");
      return;
    }
    if (!adminEmail.trim() || !memberEmail.trim()) {
      showToast("Both Admin and Member Gmail accounts are required for this demo flow.", "error");
      return;
    }

    try {
      setIsProvisioning(true);
      
      // 1. Create the Workspace
      const res = await createWorkspace(orgName, planLevel, currency);
      if (res.success) {
        const mockOrgId = "org_" + Math.random().toString(36).substr(2, 9);
        
        // 2. Dispatch Local Invitations
        addLocalInvitation(adminEmail.toLowerCase(), "admin", orgName);
        addLocalInvitation(memberEmail.toLowerCase(), "member", orgName);

        setLastProvisionedOrg({
          id: mockOrgId,
          name: orgName,
          adminEmail: adminEmail.toLowerCase(),
          memberEmail: memberEmail.toLowerCase()
        });

        showToast(`Workspace '${orgName}' initialized! Requests dispatched to ${adminEmail} & ${memberEmail}.`, "success");
        
        // Reset invite fields
        setAdminEmail("");
        setMemberEmail("");
      }
    } catch (err) {
      console.error(err);
      showToast("Workspace provisioning failed.", "error");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleTakeRequest = (email, role, orgName, orgId) => {
    // Locate the local invitation to mark it accepted
    const invite = localInvitations.find(
      inv => inv.email.toLowerCase() === email.toLowerCase() && inv.orgName === orgName && inv.status === "pending"
    );

    if (invite) {
      invite.status = "accepted";
      const saved = localStorage.getItem("billnest_invitations");
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map(item => item.id === invite.id ? { ...item, status: "accepted" } : item);
        localStorage.setItem("billnest_invitations", JSON.stringify(updated));
      }
    }

    // Programmatically switch session using our new AuthContext method!
    simulateLoginAs(email, role, orgName, orgId);
    
    // Redirect to home dashboard with new role
    navigate("/dashboard");
  };

  // Filter invitations to display only pending requests sent under the current preview session
  const activePendingInvites = localInvitations.filter(
    inv => inv.status === "pending" && (lastProvisionedOrg ? inv.orgName === lastProvisionedOrg.name : true)
  );

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12 animate-fade-in">
      
      {/* Premium Header */}
      <div>
        <h3 className="font-heading text-3xl font-black text-slate-900 tracking-tight">Multi-Tenant Workspace Provisioner</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-3xl leading-relaxed">
          Deploy clean, isolated databases for new organizations and instantly dispatch role-based invites to your administrators and developers in a unified, premium onboarding workflow.
        </p>
      </div>

      {/* Visual Sequence Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">1</div>
          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Configure Tenant</h5>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Specify brand theme & currency</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-300 hidden md:block">arrow_forward</span>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">2</div>
          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Assign Administrators</h5>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Invite Admin & Member emails</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-300 hidden md:block">arrow_forward</span>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold">3</div>
          <div>
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Accept & Simulate</h5>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Instant role context login switch</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Workspace Provisioning Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-6">
          <div className="border-b border-slate-50 pb-4">
            <h4 className="font-heading text-lg font-bold text-slate-900">Provision Organization Workspace</h4>
            <p className="text-xs text-slate-500 mt-1">Spin up isolated client structures under custom organization billing parameters.</p>
          </div>

          <form onSubmit={handleProvisionWorkspace} className="space-y-5">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Organization / Business Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">store</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Billing Labs"
                  className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-semibold transition-all outline-none"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Base Workspace Currency</label>
                <select
                  className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-3 text-sm font-semibold transition-all outline-none cursor-pointer"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="USD">USD ($) US Dollar</option>
                  <option value="EUR">EUR (€) Euro</option>
                  <option value="GBP">GBP (£) British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Subscription Tier</label>
                <select
                  className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-3 text-sm font-semibold transition-all outline-none cursor-pointer"
                  value={planLevel}
                  onChange={(e) => setPlanLevel(e.target.value)}
                >
                  <option value="starter">Starter Plan (Basic Invoicing)</option>
                  <option value="pro">Pro Agency Plan (Full Team RBAC)</option>
                  <option value="enterprise">Enterprise Tier (Unlimited API Access)</option>
                </select>
              </div>
            </div>

            {/* Accent Theme Switcher Preview */}
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2.5">Corporate Branding Color Accent</label>
              <div className="flex gap-3">
                {["indigo", "emerald", "violet", "rose", "amber"].map((col) => {
                  const colors = {
                    indigo: "bg-indigo-600 ring-indigo-100",
                    emerald: "bg-emerald-600 ring-emerald-100",
                    violet: "bg-violet-600 ring-violet-100",
                    rose: "bg-rose-600 ring-rose-100",
                    amber: "bg-amber-600 ring-amber-100"
                  };
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAccentColor(col)}
                      className={`w-9 h-9 rounded-full ${colors[col]} cursor-pointer hover:scale-105 transition-all flex items-center justify-center ${accentColor === col ? "ring-4 scale-105 border border-white" : ""}`}
                    >
                      {accentColor === col && (
                        <span className="material-symbols-outlined text-white text-[18px]">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Teammate Gmail Invitations Section */}
            <div className="border-t border-slate-100 pt-6 mt-2 space-y-4">
              <div>
                <h5 className="font-heading text-sm font-bold text-slate-800">Dispatch Instant Privilege Roles</h5>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Assign the initial Administrator and Workspace Member accounts to receive immediate login capabilities.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Gmail Address for ADMIN</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">manage_accounts</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@gmail.com"
                      className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold transition-all outline-none"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Gmail Address for MEMBER</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">group</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. member@gmail.com"
                      className="w-full bg-slate-50/50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold transition-all outline-none"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProvisioning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isProvisioning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Deploying Secure Containers...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">add_business</span>
                  Deploy Workspace & Dispatch Invites
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Invitation Receiver Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                <h4 className="font-heading text-sm font-bold text-slate-100 uppercase tracking-wider">Interactive Invitation Terminal</h4>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 font-extrabold bg-indigo-950/80 border border-indigo-900/60 px-2 py-0.5 rounded uppercase">Receiver Console</span>
            </div>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              When invitations are dispatched under this workspace flow, they populate here in real-time. Use the **Accept Invite & Login** buttons to simulate a simulated recipient switching context and launching that workspace dashboard instantly!
            </p>

            {activePendingInvites.length > 0 ? (
              <div className="space-y-3 mt-2">
                {activePendingInvites.map((invite) => {
                  const isRoleAdmin = invite.role === "admin";
                  const badgeColor = isRoleAdmin
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  
                  return (
                    <div
                      key={invite.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col gap-3 hover:border-slate-700/80 transition-all animate-slide-up"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-200 truncate">{invite.email}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Org: {invite.orgName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${badgeColor}`}>
                          {invite.role}
                        </span>
                      </div>

                      <button
                        onClick={() => handleTakeRequest(invite.email, invite.role, invite.orgName, lastProvisionedOrg?.id || "org_mock")}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-indigo-600/10"
                      >
                        <span className="material-symbols-outlined text-[15px]">login</span>
                        Accept & Sign In
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <span className="material-symbols-outlined text-slate-600 text-[32px] animate-pulse">forward_to_inbox</span>
                <div>
                  <p className="text-xs text-slate-400 font-bold">Waiting for dispatches...</p>
                  <p className="text-[10px] text-slate-600 font-semibold mt-1">Complete the Workspace Provisioner form to transmit invites.</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Switch Help Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <h5 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-widest">Multi-Tenant Context Isolation</h5>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              The BillNest platform separates tenant data strictly based on the authenticated context. The moment you switch context to an Admin or Member, all displayed transactions, clients, plans, and audit details will adjust to show that workspace only.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CreateWorkspaceTab;
