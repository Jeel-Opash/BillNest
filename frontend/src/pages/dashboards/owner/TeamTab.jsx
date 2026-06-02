import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";

const TeamTab = ({ teamList, setTeamList, showToast }) => {
  const { user } = useAuth();
  

  const [activeSubTab, setActiveSubTab] = useState("members");
  const [accessCode, setAccessCode] = useState("Loading...");
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);


  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);


  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");
  const [assignRole, setAssignRole] = useState("member");
  const [responseNotes, setResponseNotes] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);


  const fetchTeammates = async () => {
    try {
      const res = await axios.get("/auth/team/members");
      if (res.data.success && res.data.members) {
        const dbMembers = res.data.members.map(m => ({
          id: m._id,
          name: m.name || m.email.split("@")[0],
          email: m.email,
          role: m.role,
          status: m.status || "active",
          lastLogin: m.lastLogin ? new Date(m.lastLogin).toLocaleString() : "Never"
        }));
        setTeamList(dbMembers);
      }
    } catch (err) {
      console.error("Failed to load backend team members:", err);
    }
  };


  const fetchAccessCode = async () => {
    try {
      const res = await axios.get("/auth/organization/code");
      if (res.data.success) {
        setAccessCode(res.data.accessCode);
      }
    } catch (err) {
      console.error("Failed to fetch access code:", err);
    }
  };


  const fetchRequestsData = async () => {
    setIsLoadingRequests(true);
    try {
      const pendingRes = await axios.get("/auth/join-requests/pending");
      const historyRes = await axios.get("/auth/join-requests/history");
      
      if (pendingRes.data.success) {
        setPendingRequests(pendingRes.data.requests);
      }
      if (historyRes.data.success) {
        setRequestHistory(historyRes.data.requests);
      }
    } catch (err) {
      console.error("Failed to load requests data:", err);
      showToast("Failed to fetch access requests.", "error");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchTeammates();
    fetchAccessCode();
    fetchRequestsData();
  }, []);


  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    showToast("Access code copied to clipboard!", "success");
  };


  const handleRegenerateCode = async () => {
    if (!window.confirm("Are you sure you want to regenerate the access code? Any user with the old code won't be able to request access.")) return;
    
    setIsRegeneratingCode(true);
    try {
      const res = await axios.post("/auth/organization/regenerate-code");
      if (res.data.success) {
        setAccessCode(res.data.accessCode);
        showToast("New access code generated successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to regenerate code:", err);
      showToast("Failed to regenerate access code.", "error");
    } finally {
      setIsRegeneratingCode(false);
    }
  };


  const handleDeleteTeammate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this workspace?`)) return;
    try {


      setTeamList(teamList.filter(t => t.id !== id));
      showToast(`Teammate ${name} removed from workspace.`, "info");
    } catch (err) {
      showToast("Failed to remove teammate.", "error");
    }
  };


  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    setIsProcessingAction(true);
    try {
      const payload = {
        action: actionType,
        notes: responseNotes,
        ...(actionType === "approve" ? { finalRole: assignRole } : {})
      };

      const res = await axios.post(`/auth/join-requests/${selectedRequest._id}/action`, payload);
      if (res.data.success) {
        showToast(`Join request ${actionType === "approve" ? "approved" : "rejected"} successfully!`, "success");
        setSelectedRequest(null);
        setResponseNotes("");

        fetchTeammates();
        fetchRequestsData();
      }
    } catch (err) {
      console.error("Failed to process request:", err);
      showToast(err.response?.data?.message || "Failed to process request.", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };


  const handleUpdateTeammateRole = async (userId, newRole) => {
    try {

      setTeamList(teamList.map(t => t.id === userId ? { ...t, role: newRole } : t));
      showToast(`Role updated to ${newRole.toUpperCase()} successfully.`, "success");
    } catch (err) {
      showToast("Failed to update role.", "error");
    }
  };


  const renderRoleBadge = (role) => {
    const isOwner = role === "owner";
    const isAdmin = role === "admin";
    const isRO = role === "read_only" || role === "read-only";

    let style = "bg-slate-100 text-slate-700 border-slate-200";
    if (isOwner) style = "bg-indigo-50 border-indigo-100 text-indigo-700 font-bold";
    if (isAdmin) style = "bg-amber-50 border-amber-100 text-amber-700 font-bold";
    if (isRO) style = "bg-teal-50 border-teal-100 text-teal-700 font-semibold";

    return (
      <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] uppercase tracking-wider ${style}`}>
        {isRO ? "Read Only" : role}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header section with Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-heading text-2xl font-bold text-slate-900">Team Management Center</h3>
          <p className="text-slate-500 text-sm mt-1">
            Generate access codes, manage active teammates, and approve or reject join requests in real time.
          </p>
        </div>
      </div>

      {/* Access Code and Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Statistics Block */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Team</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900">{teamList.length}</span>
              <span className="text-xs text-slate-400">members</span>
            </div>
            <div className="mt-2 text-[10px] text-indigo-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Fully Scoped RBAC
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900">{pendingRequests.length}</span>
              <span className="text-xs text-slate-400">requests</span>
            </div>
            <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${pendingRequests.length > 0 && "animate-ping"}`}></span> Action Required
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Processed Requests</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900">{requestHistory.length}</span>
              <span className="text-xs text-slate-400 font-semibold text-slate-500">completed</span>
            </div>
            <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">check_circle</span> Audit History Locked
            </div>
          </div>
        </div>

        {/* Access Code Settings Generator */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4">
          <div>
            <h4 className="font-heading text-base font-extrabold text-slate-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">vpn_key</span>
              Workspace Access Code
            </h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Share this unique secure code with colleagues. They can search your org and input this code to request workspace admission.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center font-mono text-sm font-black tracking-widest text-slate-800 select-all uppercase">
              {accessCode}
            </div>
            <button
              onClick={handleCopyCode}
              title="Copy Code"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer shadow-sm outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={isRegeneratingCode}
              title="Regenerate Access Code"
              className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100/50 rounded-xl text-indigo-600 transition-all flex items-center justify-center cursor-pointer shadow-sm outline-none disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRegeneratingCode ? "animate-spin" : ""}`}>
                autorenew
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Connection Workspace Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        
        {/* Navigation bar */}
        <div className="flex border-b border-slate-50 p-2.5 bg-slate-50/50">
          {[
            { id: "members", label: "Active Teammates", symbol: "group" },
            { id: "requests", label: `Pending Access Requests (${pendingRequests.length})`, symbol: "rule" },
            { id: "history", label: "Request Ledger History", symbol: "history" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none ${
                activeSubTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.symbol}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="p-6">
          
          {/* ACTIVE TEAMMATES */}
          {activeSubTab === "members" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-heading text-sm font-bold text-slate-800">Workspace Active Roster</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scope: {user?.organization?.name}</span>
              </div>

              {teamList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No teammates registered in this workspace yet.</p>
              ) : (
                <div className="space-y-3">
                  {teamList.map(t => {
                    const initials = t.name.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase();
                    return (
                      <div key={t.id} className="p-4 bg-slate-50/40 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200/80 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {t.name}
                              {t.role === "owner" && <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-1 py-0.2 rounded shadow-sm">Owner</span>}
                            </h5>
                            <p className="text-[10px] text-slate-500">{t.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end flex-1 sm:flex-initial">
                          <div>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Privilege Role</span>
                            {t.role === "owner" ? (
                              renderRoleBadge(t.role)
                            ) : (
                              <select
                                value={t.role}
                                onChange={(e) => handleUpdateTeammateRole(t.id, e.target.value)}
                                className="bg-white border border-slate-200 focus:border-indigo-600 rounded-lg py-1 px-2.5 text-xs font-semibold outline-none cursor-pointer text-slate-700 transition-colors shadow-sm"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="read_only">Read Only</option>
                              </select>
                            )}
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Login</span>
                            <span className="text-slate-600 font-bold">{t.lastLogin}</span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 capitalize">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              Active
                            </span>
                          </div>

                          {t.role !== "owner" && (
                            <button
                              onClick={() => handleDeleteTeammate(t.id, t.name)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto sm:ml-0 cursor-pointer"
                              title="Revoke Admission & Remove"
                            >
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PENDING JOIN REQUESTS */}
          {activeSubTab === "requests" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-heading text-sm font-bold text-slate-800">Pending Authorization Queue</h4>
                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Needs Action</span>
              </div>

              {isLoadingRequests ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-slate-400 text-xs">Loading queue list...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-[44px] text-slate-300 mb-1.5">
                    inbox
                  </span>
                  <h5 className="font-heading text-xs font-bold text-slate-600">Pending Queue Empty</h5>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">
                    No users are currently requesting workspace admission. Share your Access Code to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(req => {
                    const initials = req.user?.name ? req.user.name.charAt(0).toUpperCase() : "?";
                    return (
                      <div key={req._id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200/80 transition-all">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-xs truncate">
                              {req.user?.name || "Requesting User"}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate">{req.user?.email}</p>
                            
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                              Requested Role: <span className="text-indigo-600 font-semibold">{req.role === "read_only" ? "READ ONLY" : req.role.toUpperCase()}</span>
                            </p>

                            {req.message && (
                              <div className="mt-2 p-2.5 bg-white border border-slate-200/50 rounded-xl text-slate-600 text-xs italic">
                                "{req.message}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold mb-1 hidden md:block">
                            Submitted: {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                          
                          <div className="flex gap-2 w-full md:w-auto">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType("reject");
                              }}
                              className="flex-1 md:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType("approve");
                                setAssignRole(req.role);
                              }}
                              className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                            >
                              Approve & Assign
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REQUEST HISTORY LEDGER */}
          {activeSubTab === "history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-heading text-sm font-bold text-slate-800">Immutable Request Ledger Logs</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compliant System Logs</span>
              </div>

              {isLoadingRequests ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : requestHistory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No request history processed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Final Assigned Role</th>
                        <th className="pb-3">Actioned State</th>
                        <th className="pb-3">Processed By</th>
                        <th className="pb-3">Response Notes</th>
                        <th className="pb-3">Processed Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-700">
                      {requestHistory.map(h => {
                        const isApproved = h.status === "approved";
                        const actDetails = h.approvalHistory?.[0] || {};
                        const actorName = actDetails.actedBy?.name || "Admin";

                        return (
                          <tr key={h._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{h.user?.name || "User"}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{h.user?.email}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              {renderRoleBadge(isApproved ? h.role : "None")}
                            </td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isApproved 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100/40"
                                  : "bg-rose-50 text-rose-700 border border-rose-100/40"
                              }`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-600 font-bold">{actorName}</td>
                            <td className="py-3 text-slate-500 font-medium max-w-[200px] truncate" title={actDetails.notes}>
                              {actDetails.notes || "-"}
                            </td>
                            <td className="py-3 text-slate-400 font-medium">
                              {new Date(h.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Action Processing Modal (Approve/Reject) */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h5 className="font-heading font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600">
                  {actionType === "approve" ? "check_circle" : "cancel"}
                </span>
                {actionType === "approve" ? "Approve Access Request" : "Reject Access Request"}
              </h5>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 material-symbols-outlined cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProcessSubmit}>
              <div className="p-6 space-y-4">
                
                {/* User Preview details */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {selectedRequest.user?.name ? selectedRequest.user.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-xs truncate">{selectedRequest.user?.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{selectedRequest.user?.email}</div>
                  </div>
                </div>

                {actionType === "approve" && (
                  <div>
                    <label className="block text-slate-500 text-xs font-bold mb-1">Assign Workspace Role</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none cursor-pointer transition-all"
                      value={assignRole}
                      onChange={(e) => setAssignRole(e.target.value)}
                    >
                      <option value="member">Member (Write & Edit)</option>
                      <option value="read_only">Read-Only Observer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1">
                    {actionType === "approve" ? "Approval Notes (Optional)" : "Reason for Rejection"}
                  </label>
                  <textarea
                    required={actionType === "reject"}
                    placeholder={actionType === "approve" ? "Provide welcome notes or guidelines..." : "Explain why the access was rejected..."}
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all resize-none"
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    actionType === "approve" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isProcessingAction ? "Processing..." : actionType === "approve" ? "Grant Access" : "Deny Access"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeamTab;
