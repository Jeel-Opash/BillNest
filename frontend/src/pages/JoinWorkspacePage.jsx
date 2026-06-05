import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JoinWorkspacePage = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("join");


  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [requestedRole, setRequestedRole] = useState("member");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);


  const [myRequests, setMyRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);


  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/auth/organizations/search?query=${searchQuery}`);
        if (res.data.success) {
          setSearchResults(res.data.organizations);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);


  const fetchMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await axios.get("/auth/join-requests/my");
      if (res.data.success) {
        setMyRequests(res.data.requests);
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      showToast("Failed to load your access requests.", "error");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchMyRequests();
    }
  }, [activeTab]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedOrg && !accessCode) {
      showToast("Please search/select an organization or enter an access code.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        role: requestedRole,
        message,
        ...(selectedOrg ? { organizationId: selectedOrg._id } : {}),
        ...(accessCode ? { accessCode: accessCode.trim().toUpperCase() } : {}),
      };

      const res = await axios.post("/auth/join-requests", payload);
      if (res.data.success) {
        showToast("Join request submitted successfully!", "success");
        setSelectedOrg(null);
        setSearchQuery("");
        setAccessCode("");
        setMessage("");
        setActiveTab("requests");
      }
    } catch (err) {
      console.error("Submit request error:", err);
      showToast(err.response?.data?.message || "Failed to submit join request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 font-sans antialiased p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-[0_15px_40px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col">

        {/* Upper Header Branding */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[32px] bg-white/15 p-2 rounded-2xl">
              hub
            </span>
            <div>
              <h2 className="font-heading text-2xl font-black tracking-tight">Workspace Connection Center</h2>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mt-0.5">BillNest SaaS Network</p>
            </div>
          </div>
          <p className="text-indigo-100 text-xs mt-3 leading-relaxed">
            Search active organizations, use security access codes, choose your roles, and submit requests to collaborate with your team.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "join"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40"
                : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Join Organization
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "requests"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40"
                : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
            My Requests
            {myRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 flex-1">
          {activeTab === "join" ? (
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Search Organization */}
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                  1. Find Organization
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search by company name..."
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedOrg) setSelectedOrg(null);
                    }}
                  />
                  {isSearching && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && !selectedOrg && (
                  <div className="mt-2 border border-slate-100 bg-white rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2 space-y-1 animate-fade-in absolute z-50 w-[88%]">
                    {searchResults.map((org) => (
                      <button
                        key={org._id}
                        type="button"
                        onClick={() => {
                          setSelectedOrg(org);
                          setSearchQuery(org.name);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50/50 rounded-xl transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{org.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate">/{org.slug}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Access Code Verification */}
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                  2. Organization Access Code
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    vpn_key
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter 9-digit Code (e.g., ORG-X8Z9A1)"
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm font-mono font-bold uppercase tracking-widest transition-all outline-none"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1.5 leading-relaxed">
                  * Obtain the unique authorization code from your Organization Owner or Administrator settings.
                </p>
              </div>

              {/* Role Requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    3. Request Role Privilege
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      badge
                    </span>
                    <select
                      className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 pl-11 pr-8 text-xs font-semibold outline-none appearance-none cursor-pointer transition-all"
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value)}
                    >
                      <option value="member">Member (Write & Edit)</option>
                      <option value="read_only">Read-Only (Observer / Auditor)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    4. Message (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Briefly state your purpose..."
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-4 text-xs font-semibold transition-all outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 rounded-2xl font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">publish</span>
                      Submit Join Request
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* My Requests List */
            <div className="space-y-4">
              {isLoadingRequests ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-slate-400 text-xs font-bold">Retrieving submitted requests...</p>
                </div>
              ) : myRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
                    inbox
                  </span>
                  <h4 className="font-heading text-sm font-bold text-slate-600">No requests submitted yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Your workspace join request ledger is currently empty. Use the join form to request organization access.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {myRequests.map((req) => {
                    const orgName = req.organization?.name || "Target Workspace";
                    const isPending = req.status === "pending";
                    const isApproved = req.status === "approved";
                    const isRejected = req.status === "rejected";

                    let badgeColor = "bg-slate-50 text-slate-600 border-slate-200";
                    if (isPending) badgeColor = "bg-amber-50 text-amber-700 border-amber-200/50";
                    if (isApproved) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                    if (isRejected) badgeColor = "bg-rose-50 text-rose-700 border-rose-200/50";

                    return (
                      <div
                        key={req._id}
                        className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200/80 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{orgName}</h5>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                              {req.status}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                            REQUESTED PRIVILEGE: <span className="text-slate-600">{req.role.toUpperCase()}</span>
                          </p>

                          {req.message && (
                            <p className="text-xs text-slate-500 italic mt-1.5 bg-white p-2 rounded-lg border border-slate-200/30">
                              "{req.message}"
                            </p>
                          )}

                          {/* Approval/Rejection Notes */}
                          {req.approvalHistory && req.approvalHistory.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200/50">
                              <h6 className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">feedback</span>
                                Admin Response Note
                              </h6>
                              <p className="text-xs text-slate-600 font-semibold bg-indigo-50/30 border border-indigo-100/30 p-2.5 rounded-xl">
                                {req.approvalHistory[req.approvalHistory.length - 1].notes || "No additional comments provided."}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right w-full md:w-auto">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Submitted: {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          {isApproved && (
                            <button
                              onClick={() => {
                                showToast("Workspace joined successfully! Relaunching dashboard...", "success");
                                setTimeout(() => {
                                  window.location.href = "/dashboard";
                                }, 500);
                              }}
                              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">launch</span>
                              Enter Workspace
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
        </div>

        {/* Footer Navigation Back to Login/Dashboard */}
        <div className="bg-slate-50 p-5 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-all outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Dashboard
          </button>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Secured via SSL & RBAC
          </span>
        </div>

      </div>
    </div>
  );
};

export default JoinWorkspacePage;
