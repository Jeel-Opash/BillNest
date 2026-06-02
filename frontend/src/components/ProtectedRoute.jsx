import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4 font-sans">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
        BN
      </div>
      <span className="font-bold text-lg text-slate-900 tracking-tight">BillNest</span>
    </div>

    {/* Skeleton sidebar + content */}
    <div className="flex gap-4 w-full max-w-4xl px-6">
      <div className="w-48 flex flex-col gap-3 flex-shrink-0">
        <div className="h-8 bg-slate-200 rounded-xl animate-pulse"></div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }}></div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }}></div>
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: "100ms" }}></div>
        </div>
      </div>
    </div>

    <p className="text-xs text-slate-400 font-semibold mt-2 animate-pulse">Loading your workspace...</p>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force workspace welcome page if user hasn't created or joined an organization
  if (!user.organization && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  // Redirect away from welcome screen if organization is already active
  if (user.organization && location.pathname === "/welcome") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
