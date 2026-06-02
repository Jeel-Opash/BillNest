import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-700 font-sans antialiased">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">

        <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-500 text-[40px]">lock</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            You don't have permission to access this resource. Your current role{" "}
            {user?.role && (
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs uppercase">
                {user.role}
              </span>
            )}{" "}
            does not have the required privileges.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 w-full shadow-sm text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Role Hierarchy</p>
          <div className="space-y-2">
            {[
              { role: "Owner", desc: "Full access to all features", color: "bg-purple-50 text-purple-700 border-purple-100" },
              { role: "Admin", desc: "Manage team, clients, invoices", color: "bg-blue-50 text-blue-700 border-blue-100" },
              { role: "Member", desc: "Create invoices, view clients", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
              { role: "Read-Only", desc: "View-only access", color: "bg-slate-50 text-slate-600 border-slate-200" },
            ].map((r) => (
              <div key={r.role} className={`flex items-center justify-between p-2.5 rounded-xl border ${r.color} ${user?.role === r.role.toLowerCase().replace("-", "_") || user?.role === r.role.toLowerCase() ? "ring-2 ring-offset-1 ring-indigo-400" : ""}`}>
                <span className="font-bold text-xs">{r.role}</span>
                <span className="text-[10px] font-semibold opacity-80">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </button>
        </div>

        <button
          onClick={() => logout()}
          className="text-xs text-slate-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span>
          Sign out and switch account
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
