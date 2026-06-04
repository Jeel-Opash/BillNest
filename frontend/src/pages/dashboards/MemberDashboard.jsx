import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";


import MemberDashboardTab from "./member/MemberDashboardTab";
import MemberClientsTab from "./member/MemberClientsTab";
import MemberInvoicesTab from "./member/MemberInvoicesTab";
import MemberSubscriptionsTab from "./member/MemberSubscriptionsTab";
import MemberPaymentsTab from "./member/MemberPaymentsTab";
import MemberActivityTab from "./member/MemberActivityTab";
import MemberNotificationsTab from "./member/MemberNotificationsTab";
import MemberProfileTab from "./member/MemberProfileTab";

const MemberDashboard = () => {
  const { user, logout, showToast } = useAuth();
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const [clients, setClients] = useState([
    { id: "c1", name: "ABC Restaurant", company: "ABC Food & Beverages", email: "owner@abcrestaurant.com", phone: "+91 98765 43210", taxId: "24ABCDE1234F1Z5", address: "Surat, Gujarat", currency: "INR", notes: "Prefers UPI payments" },
    { id: "c2", name: "Pixel Studio", company: "Pixel Creative Labs", email: "finance@pixelstudio.com", phone: "+91 99988 77766", taxId: "27PIXEL7788A1Z9", address: "Mumbai, Maharashtra", currency: "INR", notes: "Monthly billing cycle" },
    { id: "c3", name: "Nova Software Inc", company: "Nova Tech Ltd", email: "billing@novatech.com", phone: "+1 (555) 234-5678", taxId: "US9988223", address: "Austin, Texas", currency: "USD", notes: "Stripe recurring billing active" }
  ]);

  const [invoices, setInvoices] = useState([
    { id: "INV-MEMB-1001", client: "ABC Restaurant", amount: 15000, date: "2026-05-29", dueDate: "2026-06-12", status: "pending", itemsList: [{ desc: "UI Design Retainer", qty: 1, price: 12000 }, { desc: "Hosting Retainer", qty: 1, price: 3000 }] },
    { id: "INV-MEMB-1002", client: "Pixel Studio", amount: 25000, date: "2026-05-28", dueDate: "2026-06-10", status: "draft", itemsList: [{ desc: "Website Retainer", qty: 1, price: 25000 }] },
    { id: "INV-MEMB-1003", client: "Nova Software Inc", amount: 8000, date: "2026-05-25", dueDate: "2026-06-05", status: "paid", itemsList: [{ desc: "Technical Support Support", qty: 8, price: 1000 }] }
  ]);

  const [notifications, setNotifications] = useState([
    { id: "n1", type: "client_update", title: "Client Update", message: "ABC Restaurant viewed Invoice INV-MEMB-1001.", time: "10 mins ago", read: false },
    { id: "n2", type: "payment_success", title: "Payment Success", message: "Invoice INV-MEMB-1003 was marked as paid.", time: "2 hours ago", read: false },
    { id: "n3", type: "subscription_renewal", title: "Subscription Renewed", message: "Nova Software Inc payment processed successfully.", time: "1 day ago", read: true }
  ]);

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-700 font-sans antialiased">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-45 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col p-5 bg-white border-r border-slate-100 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate max-w-[120px]">{user?.organization?.name || "Workspace"}</h1>
              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase mt-0.5">Member Console</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {[
            { id: "dashboard", label: "Dashboard", symbol: "dashboard" },
            { id: "clients", label: "My Clients", symbol: "groups" },
            { id: "invoices", label: "Invoices", symbol: "receipt_long" },
            { id: "subscriptions", label: "Subscriptions", symbol: "autorenew" },
            { id: "payments", label: "Payments Status", symbol: "payments" },
            { id: "activity", label: "Activity Center", symbol: "assignment" },
            { id: "notifications", label: `Notifications (${notifications.filter(n => !n.read).length})`, symbol: "notifications" },
            { id: "profile", label: "Profile Settings", symbol: "person" }
          ].map((menu) => {
            const isActive = activePage === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  handlePageChange(menu.id);
                  setIsSidebarOpen(false);
                }}
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
            onClick={() => {
              handlePageChange("profile");
              setIsSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity text-left outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-200/50 shadow-sm flex items-center justify-center font-extrabold text-white text-sm select-none flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "M"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-[11px] truncate leading-snug">{user?.name || "Workspace Member"}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Workspace Member</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="md:ml-64 ml-0 flex-1 min-h-screen flex flex-col min-w-0">

        {/* Global sticky Header */}
        <header className="sticky top-0 right-0 z-40 h-16 w-full flex justify-between items-center px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-950 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
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
                    {user?.name?.charAt(0).toUpperCase() || "M"}
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-3 z-50 flex flex-col gap-2.5 animate-fade-in text-slate-700">
                      <div className="px-2 py-1.5 border-b border-slate-50 flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-xs truncate">{user?.name || "Workspace Member"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{user?.email}</span>
                        <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded w-fit leading-none">
                          Workspace Member
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
                Running isolated workspace parameters for <strong className="text-indigo-600">{user?.organization?.name || "CodeCraft Agency"}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100/50 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span>
              <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider">Member privileges active</span>
            </div>
          </div>

          {/* Rendering active tab page */}
          {activePage === "dashboard" && (
            <MemberDashboardTab
              user={user}
              clients={clients}
              invoices={invoices}
              handlePageChange={handlePageChange}
              showToast={showToast}
            />
          )}

          {activePage === "clients" && (
            <MemberClientsTab
              clients={clients}
              setClients={setClients}
              invoices={invoices}
              showToast={showToast}
            />
          )}

          {activePage === "invoices" && (
            <MemberInvoicesTab
              invoices={invoices}
              setInvoices={setInvoices}
              clients={clients}
              user={user}
              showToast={showToast}
            />
          )}

          {activePage === "subscriptions" && (
            <MemberSubscriptionsTab
              clients={clients}
              showToast={showToast}
            />
          )}

          {activePage === "payments" && (
            <MemberPaymentsTab />
          )}

          {activePage === "activity" && (
            <MemberActivityTab />
          )}

          {activePage === "notifications" && (
            <MemberNotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
              showToast={showToast}
            />
          )}

          {activePage === "profile" && (
            <MemberProfileTab
              user={user}
              showToast={showToast}
            />
          )}

        </div>
      </main>

    </div>
  );
};

export default MemberDashboard;
