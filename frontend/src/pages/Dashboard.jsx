import React from "react";
import { useAuth } from "../context/AuthContext";

import OwnerDashboard from "./dashboards/OwnerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import MemberDashboard from "./dashboards/MemberDashboard";
import ReadOnlyDashboard from "./dashboards/ReadOnlyDashboard";

const Dashboard = () => {
  const { user, localInvitations, acceptLocalInvitation, declineLocalInvitation } = useAuth();

  const pendingInvite = localInvitations?.find(
    (inv) => inv.email.toLowerCase() === user?.email?.toLowerCase() && inv.status === "pending"
  );

  const getRoleDisplayName = (r) => {
    switch (r) {
      case "admin": return "Workspace Admin";
      case "member": return "Workspace Member";
      case "read_only": return "Read-Only Observer";
      default: return r;
    }
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case "owner":
        return <OwnerDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "member":
        return <MemberDashboard />;
      case "read_only":
      case "read-only":
        return <ReadOnlyDashboard />;
      default:
        return <MemberDashboard />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {renderDashboard()}

      {pendingInvite && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-96 bg-surface-container-lowest/90 backdrop-blur-md border-2 border-primary/30 shadow-2xl p-5 rounded-2xl flex flex-col gap-4 animate-fade-in transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center relative">
              <span className="material-symbols-outlined text-[24px]">mail</span>
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <div>
              <h4 className="font-bold text-headline-sm text-on-surface">Workspace Invitation</h4>
              <p className="text-body-sm text-on-surface-variant mt-1">
                You have been invited by <strong className="text-primary">{pendingInvite.orgName}</strong> to join as a <strong className="text-primary">{getRoleDisplayName(pendingInvite.role)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => acceptLocalInvitation(pendingInvite.id)}
              className="flex-1 bg-primary text-on-primary py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Accept & Join
            </button>
            <button
              onClick={() => declineLocalInvitation(pendingInvite.id)}
              className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
