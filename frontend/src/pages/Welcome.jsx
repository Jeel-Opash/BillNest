import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Welcome = () => {
  const { user, createOrganization, showToast, logout } = useAuth();
  const navigate = useNavigate();


  const [phase, setPhase] = useState("choose");
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [activePendingRequest, setActivePendingRequest] = useState(null);


  const [orgForm, setOrgForm] = useState({
    name: "",
    industry: "Technology",
    businessType: "SaaS",
    country: "India",
    currency: "INR",
    timezone: "Asia/Kolkata"
  });


  const [joinForm, setJoinForm] = useState({
    accessCode: "",
    role: "member",
    message: ""
  });


  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/auth/join-requests/my");
      if (res.data.success) {
        setMyRequests(res.data.requests);
        const pending = res.data.requests.find(r => r.status === "pending");
        if (pending) {
          setActivePendingRequest(pending);
          setPhase("pending");
        } else {
          setActivePendingRequest(null);


          if (res.data.requests.some(r => r.status === "approved")) {

            const profileRes = await axios.get("/auth/team/members");

            handleManualRefresh();
          }
        }
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);


  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      showToast("Syncing workspace authorization...", "info");

      const savedRefreshToken = localStorage.getItem("bn_refresh_token");
      if (savedRefreshToken) {
        const res = await axios.post("/auth/refresh", { refreshToken: savedRefreshToken });
        if (res.data.success) {
          localStorage.setItem("bn_access_token", res.data.token);
          if (res.data.refreshToken) {
            localStorage.setItem("bn_refresh_token", res.data.refreshToken);
          }


          window.location.reload();
          return;
        }
      }
      

      const reqRes = await axios.get("/auth/join-requests/my");
      if (reqRes.data.success) {
        setMyRequests(reqRes.data.requests);
        const pending = reqRes.data.requests.find(r => r.status === "pending");
        if (pending) {
          setActivePendingRequest(pending);
          showToast("Request is still pending workspace owner review.", "warning");
        } else {
          const approved = reqRes.data.requests.find(r => r.status === "approved");
          if (approved) {
            showToast("Congratulations! Your request was approved. Fetching workspace details...", "success");

            window.location.reload();
          } else {
            showToast("No active pending request found.", "info");
            setPhase("choose");
          }
        }
      }
    } catch (err) {
      showToast("Workspace synchronization failed. Try logging in again.", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this access request?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`/auth/join-requests/${requestId}`);
      if (res.data.success) {
        showToast("Join request cancelled successfully.", "info");
        setActivePendingRequest(null);
        setPhase("choose");
        fetchMyRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel request.", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault();
    if (!orgForm.name.trim()) {
      showToast("Organization Name is required.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await createOrganization(orgForm);
      if (res.success) {
        showToast(`Workspace '${orgForm.name}' created! Redirecting...`, "success");

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (err) {
      showToast(err.message || "Failed to create organization.", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleJoinOrgSubmit = async (e) => {
    e.preventDefault();
    if (!joinForm.accessCode.trim()) {
      showToast("Access Code is required.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/auth/join-requests", {
        accessCode: joinForm.accessCode.trim().toUpperCase(),
        role: joinForm.role,
        message: joinForm.message
      });

      if (res.data.success) {
        showToast("Access request submitted successfully!", "success");
        fetchMyRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit access request. Check access code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Gradient Blurs */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 flex flex-col gap-6">
        
        {/* Top Header */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[42px] text-indigo-400 bg-indigo-500/15 p-2 rounded-2xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="text-3xl font-black font-heading tracking-tight text-white">BillNest</span>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            Hi, <span className="text-indigo-300 font-bold">{user?.name}</span>! Welcome to the secure multi-tenant billing workspace. Let's initialize your team access.
          </p>
        </div>

        {/* Phase View: Choose */}
        {phase === "choose" && (
          <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col gap-8 transition-all duration-300">
            <div>
              <h3 className="text-xl font-black text-white text-center">Setup Workspace Gateway</h3>
              <p className="text-xs text-slate-400 text-center mt-1">Select one of the two self-service actions below to proceed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option A: Create Org */}
              <div 
                onClick={() => setPhase("create")}
                className="group bg-slate-900 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 shadow-lg text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-md">
                  <span className="material-symbols-outlined text-[28px]">add_business</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">A. Create New Organization</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Initialize a fresh database-isolated workspace. You'll be assigned the role of <strong>Owner</strong> and can manage clients, products, and invite administrators.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-black mt-auto pt-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Initialize Workspace <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>

              {/* Option B: Join Org */}
              <div 
                onClick={() => setPhase("join")}
                className="group bg-slate-900 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 shadow-lg text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-md">
                  <span className="material-symbols-outlined text-[28px]">group_add</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">B. Join Existing Organization</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Enter an active organization's unique access code, request your target privilege role (Member or Read-Only), and submit a request to their administrators.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-black mt-auto pt-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Request Admission <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Signed in as {user?.email}</span>
              <button 
                onClick={() => logout()} 
                className="text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer outline-none bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Phase View: Create Org Flow */}
        {phase === "create" && (
          <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setPhase("choose")}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <div>
                <h3 className="text-lg font-black text-white">Create Workspace Profile</h3>
                <p className="text-xs text-slate-400">Deploy a tenant context onto our SaaS billing architecture</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrgSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Acme Corp" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Industry</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.industry}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                  >
                    {["Technology", "Finance", "Healthcare", "Education", "E-commerce", "Marketing", "Other"].map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Type</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.businessType}
                    onChange={(e) => setOrgForm({ ...orgForm, businessType: e.target.value })}
                  >
                    {["SaaS", "Agency", "Enterprise", "Small Business", "Sole Proprietor", "Nonprofit"].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.country}
                    onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                  >
                    {["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.currency}
                    onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  >
                    {["INR", "USD", "GBP", "EUR", "CAD", "AUD", "SGD"].map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timezone</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    value={orgForm.timezone}
                    onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                  >
                    {[
                      { name: "Asia/Kolkata (IST)", val: "Asia/Kolkata" },
                      { name: "America/New_York (EST)", val: "America/New_York" },
                      { name: "Europe/London (GMT)", val: "Europe/London" },
                      { name: "America/Los_Angeles (PST)", val: "America/Los_Angeles" },
                      { name: "Asia/Singapore (SGT)", val: "Asia/Singapore" }
                    ].map(tz => (
                      <option key={tz.val} value={tz.val}>{tz.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs cursor-pointer shadow-lg outline-none mt-4"
              >
                {loading ? "Configuring Tenant Workspace..." : "Create Organization"}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>
          </div>
        )}

        {/* Phase View: Join Org Flow */}
        {phase === "join" && (
          <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setPhase("choose")}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <div>
                <h3 className="text-lg font-black text-white">Join Existing Workspace</h3>
                <p className="text-xs text-slate-400">Request admission via a workspace-specific code</p>
              </div>
            </div>

            <form onSubmit={handleJoinOrgSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization Access Code *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                    vpn_key
                  </span>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. ORG-A1B2 or 4-digit code" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors uppercase font-mono"
                    value={joinForm.accessCode}
                    onChange={(e) => setJoinForm({ ...joinForm, accessCode: e.target.value })}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Ask your organization's Owner or Admin for their 4-digit unique code.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Privilege Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "member", title: "Member", desc: "Create/Edit invoices, view active plans.", icon: "person" },
                    { id: "read_only", title: "Read-Only", desc: "View dashboards and metrics only.", icon: "visibility" }
                  ].map(r => {
                    const isSel = joinForm.role === r.id;
                    return (
                      <div 
                        key={r.id}
                        onClick={() => setJoinForm({ ...joinForm, role: r.id })}
                        className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all ${
                          isSel 
                            ? "bg-emerald-950/20 border-emerald-500/80 text-emerald-400" 
                            : "bg-slate-900 border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-slate-200">{r.title}</h4>
                          <span className="material-symbols-outlined text-[16px]">{r.icon}</span>
                        </div>
                        <p className="text-[9px] leading-relaxed opacity-70">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Optional Introduction Message</label>
                <textarea 
                  placeholder="Tell the owner why you are requesting admission..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors h-20 resize-none"
                  value={joinForm.message}
                  onChange={(e) => setJoinForm({ ...joinForm, message: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs cursor-pointer shadow-lg outline-none mt-2"
              >
                {loading ? "Submitting Access Request..." : "Request Workspace Admission"}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>
          </div>
        )}

        {/* Phase View: Pending Approval Page */}
        {phase === "pending" && activePendingRequest && (
          <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 transition-all duration-300">
            
            <div className="text-center flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse duration-1000">
                <span className="material-symbols-outlined text-amber-500 text-[36px]">hourglass_empty</span>
              </div>
              
              <div>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase rounded-full px-3 py-1 tracking-wider inline-block select-none animate-pulse">
                  Pending Owner Approval
                </span>
                <h3 className="text-xl font-black text-white mt-3">Access Request Pending</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your request to join <strong className="text-slate-100">{activePendingRequest.organization?.name}</strong> is awaiting authorization from their administrative workspace.
                </p>
              </div>
            </div>

            {/* Request Summary Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs text-left">
              <h4 className="font-bold text-white text-[10px] uppercase tracking-wider text-slate-400">Request Credentials Summary</h4>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-3">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Workspace Organization</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">{activePendingRequest.organization?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Requested Privilege</span>
                  <span className="text-indigo-400 font-bold mt-0.5 block uppercase">{activePendingRequest.role}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Submitted On</span>
                  <span className="text-slate-300 font-semibold mt-0.5 block">
                    {new Date(activePendingRequest.createdAt).toLocaleString()}
                  </span>
                </div>
                {activePendingRequest.message && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Your Message</span>
                    <p className="text-slate-300 italic mt-0.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 leading-normal">
                      "{activePendingRequest.message}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Poll Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button 
                onClick={handleManualRefresh}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs cursor-pointer shadow-md outline-none border border-slate-800"
              >
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                {loading ? "Checking..." : "Refresh Authorization Status"}
              </button>

              <button 
                onClick={() => handleCancelRequest(activePendingRequest._id)}
                disabled={loading}
                className="w-full bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs cursor-pointer shadow-md outline-none border border-rose-900/40"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Cancel Request
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-500">Need to try a different access code?</span>
              <button 
                onClick={() => logout()}
                className="text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer outline-none bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span> Sign Out
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Welcome;
