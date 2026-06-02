import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";


import AdminDashboardTab from "./admin/AdminDashboardTab";
import AdminClientsTab from "./admin/AdminClientsTab";
import AdminInvoicesTab from "./admin/AdminInvoicesTab";
import AdminSubscriptionsTab from "./admin/AdminSubscriptionsTab";
import AdminPaymentsTab from "./admin/AdminPaymentsTab";
import AdminTeamTab from "./admin/AdminTeamTab";
import AdminReportsTab from "./admin/AdminReportsTab";
import AdminAuditTab from "./admin/AdminAuditTab";
import AdminSettingsTab from "./admin/AdminSettingsTab";
import AdminNotificationsTab from "./admin/AdminNotificationsTab";
import AdminProfileTab from "./admin/AdminProfileTab";

const AdminDashboard = () => {
  const { user, logout, showToast, addLocalInvitation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePageFromPath = () => {
    const parts = location.pathname.split("/");
    return parts[2] || "dashboard";
  };

  const activePage = getActivePageFromPath();

  const handlePageChange = (page) => {
    if (page === "dashboard") {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${page}`);
    }
  };

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);


  const [clients, setClients] = useState([
    { id: "c1", name: "ABC Restaurant", company: "ABC Food & Beverages", email: "owner@abcrestaurant.com", phone: "+91 98765 43210", taxId: "24ABCDE1234F1Z5", address: "Surat, Gujarat", currency: "INR", notes: "Prefers UPI payments", archived: false },
    { id: "c2", name: "Pixel Studio", company: "Pixel Creative Labs", email: "finance@pixelstudio.com", phone: "+91 99988 77766", taxId: "27PIXEL7788A1Z9", address: "Mumbai, Maharashtra", currency: "INR", notes: "Monthly billing cycle", archived: false },
    { id: "c3", name: "Nova Software Inc", company: "Nova Tech Ltd", email: "billing@novatech.com", phone: "+1 (555) 234-5678", taxId: "US9988223", address: "Austin, Texas", currency: "USD", notes: "Stripe recurring billing active", archived: false }
  ]);

  const [invoices, setInvoices] = useState([
    { id: "INV-2026-0001", client: "XYZ Pvt Ltd", amount: 18000, date: "2026-05-29", dueDate: "2026-06-12", status: "sent", itemsList: [{ desc: "Custom Plugin Integration", qty: 1, price: 18000 }] },
    { id: "INV-2026-0002", client: "ABC Restaurant", amount: 31000, date: "2026-05-28", dueDate: "2026-06-10", status: "sent", itemsList: [{ desc: "Website Design", qty: 1, price: 25000 }, { desc: "Hosting Support", qty: 12, price: 500 }] },
    { id: "INV-2026-0003", client: "Pixel Studio", amount: 15000, date: "2026-05-20", dueDate: "2026-05-30", status: "paid", itemsList: [{ desc: "Logo Design Pro Package", qty: 1, price: 15000 }] }
  ]);

  const [teamList, setTeamList] = useState(() => {
    try {
      const saved = localStorage.getItem(`workspace_${user?.email || "guest"}_team_list`);
      return saved ? JSON.parse(saved) : [
        { id: "t1", name: user?.name || "Rahul Patel", email: user?.email || "rahul@codecraft.com", role: "owner", status: "active", lastLogin: "Just now" }
      ];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState([
    { id: "n1", type: "payment_success", title: "Invoice Paid Successfully", message: "ABC Restaurant paid Invoice INV-2026-0003 successfully.", time: "1 hour ago", read: false },
    { id: "n2", type: "payment_failed", title: "Payment Dispatch Failure", message: "Nova Software Inc failed card payment retry scheduled.", time: "1 day ago", read: false }
  ]);

  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`workspace_${user.email}_team_list`, JSON.stringify(teamList));
    }
  }, [teamList, user]);

  useEffect(() => {
    const fetchBackendTeammates = async () => {
      try {
        const res = await axios.get("/auth/team/members");
        if (res.data.success && res.data.members) {
          const dbMembers = res.data.members.map(m => ({
            id: m._id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
            role: m.role,
            status: m.status || "active",
            lastLogin: m.lastLogin ? new Date(m.lastLogin).toLocaleString() : "Never connected"
          }));

          setTeamList(prev => {
            const merged = [...dbMembers];
            prev.forEach(p => {
              if (p.status === "pending" && !merged.some(m => m.email.toLowerCase() === p.email.toLowerCase())) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load backend team members:", err);
      }
    };
    
    if (user) {
      fetchBackendTeammates();
    }
  }, [user]);

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-700 font-sans antialiased">

      {/* Sidebar Layout */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-5 bg-white border-r border-slate-100 z-50">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate max-w-[150px]">{user?.organization?.name || "Workspace"}</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase mt-0.5">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {[
            { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
            { id: "clients", label: "Clients", symbol: "groups" },
            { id: "invoices", label: "Invoices", symbol: "receipt_long" },
            { id: "subscriptions", label: "Subscriptions", symbol: "autorenew" },
            { id: "payments", label: "Payments", symbol: "payments" },
            { id: "team", label: "Team Members", symbol: "badge" },
            { id: "reports", label: "Reports", symbol: "analytics" },
            { id: "audit", label: "Audit Logs", symbol: "terminal" },
            { id: "settings", label: "Settings & API Keys", symbol: "settings" },
            { id: "notifications", label: `Notifications (${notifications.filter(n => !n.read).length})`, symbol: "notifications" },
            { id: "profile", label: "Profile Settings", symbol: "person" }
          ].map((menu) => {
            const isActive = activePage === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => handlePageChange(menu.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-150 text-left cursor-pointer text-xs ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{menu.symbol}</span>
                <span>{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => handlePageChange("profile")}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity text-left outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-200/50 shadow-sm flex items-center justify-center font-extrabold text-white text-sm select-none flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-[11px] truncate leading-snug">{user?.name || "Workspace Admin"}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Workspace Admin</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        {/* Global sticky Header */}
        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center">
            <span className="text-sm font-bold text-slate-700 capitalize">
              {activePage.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center px-3 py-1 bg-indigo-50/80 text-indigo-600 border border-indigo-100/30 rounded-full gap-1.5 select-none">
              <span className="material-symbols-outlined text-[15px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{user?.organization?.name || "Corporate Space"}</span>
            </div>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6 relative">
              <button
                onClick={() => handlePageChange("notifications")}
                className="text-slate-400 hover:text-slate-600 transition-colors relative cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_6px_#4f46e5]"></span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all outline-none flex items-center justify-center cursor-pointer"
                >
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs select-none">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-3 z-50 flex flex-col gap-2.5 animate-fade-in text-slate-700">
                      <div className="px-2 py-1.5 border-b border-slate-50 flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-xs truncate">{user?.name || "Workspace Admin"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email}</span>
                        <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded w-fit leading-none">
                          Workspace Admin
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            handlePageChange("profile");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          Profile Settings
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-50">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                          Sign Out Workspace
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Outer body view */}
        <div className="p-8 w-full flex-1 flex flex-col gap-8 animate-fade-in">

          {/* Welcome Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-slate-900 font-heading text-xl font-black tracking-tight">Welcome, {user?.name.split(" ")[0]}!</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold max-w-xl">
                Running isolated workspace parameters and daily invoicing dispatch pipelines for <strong className="text-indigo-600">{user?.organization?.name || "CodeCraft Agency"}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100/50 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span>
              <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider">Admin privileges active</span>
            </div>
          </div>

          {/* Rendering active tab page */}
          {activePage === "dashboard" && (
            <AdminDashboardTab
              user={user}
              clients={clients}
              invoices={invoices}
              teamList={teamList}
              handlePageChange={handlePageChange}
              showToast={showToast}
            />
          )}

          {activePage === "clients" && (
            <AdminClientsTab
              clients={clients}
              setClients={setClients}
              invoices={invoices}
              showToast={showToast}
            />
          )}

          {activePage === "invoices" && (
            <AdminInvoicesTab
              invoices={invoices}
              setInvoices={setInvoices}
              clients={clients}
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "subscriptions" && (
            <AdminSubscriptionsTab
              clients={clients}
              showToast={showToast}
            />
          )}

          {activePage === "payments" && (
            <AdminPaymentsTab
              showToast={showToast}
            />
          )}

          {activePage === "team" && (
            <AdminTeamTab
              user={user}
              teamList={teamList}
              setTeamList={setTeamList}
              addLocalInvitation={addLocalInvitation}
              showToast={showToast}
            />
          )}

          {activePage === "reports" && (
            <AdminReportsTab
              invoices={invoices}
              clients={clients}
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "audit" && (
            <AdminAuditTab />
          )}

          {activePage === "settings" && (
            <AdminSettingsTab
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "notifications" && (
            <AdminNotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
              showToast={showToast}
            />
          )}

          {activePage === "profile" && (
            <AdminProfileTab
              user={user}
              showToast={showToast}
            />
          )}

        </div>
      </main>

    </div>
  );
};

export default AdminDashboard;
