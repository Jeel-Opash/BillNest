import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import OwnerDashboard from "./dashboards/OwnerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import MemberDashboard from "./dashboards/MemberDashboard";
import ReadOnlyDashboard from "./dashboards/ReadOnlyDashboard";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const roleConfig = {
  owner: {
    title: "Owner Dashboard",
    eyebrow: "Full tenant command center",
    description: "Revenue, invoices, subscriptions, team access, API keys, and audit health for this workspace.",
    badge: "Owner",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    metrics: [
      { label: "MRR", value: currency.format(125000), change: "+12.4%", trend: "up", icon: CreditCard },
      { label: "Outstanding", value: currency.format(42000), change: "7 overdue", trend: "down", icon: AlertTriangle },
      { label: "Paid This Month", value: currency.format(850000), change: "+18.2%", trend: "up", icon: CheckCircle2 },
      { label: "Active Subscriptions", value: "42", change: "+5 new", trend: "up", icon: Activity },
    ],
    permissions: [
      "Manage organization settings, billing defaults, and API keys",
      "Invite admins, members, and read-only observers",
      "Create, edit, send, void, and export invoices",
      "View immutable audit logs and tenant isolation status",
    ],
    actions: ["Create invoice", "Invite teammate", "Generate API key", "Export reports"],
  },
  admin: {
    title: "Admin Dashboard",
    eyebrow: "Operational billing console",
    description: "Manage clients, invoice flow, plans, reports, and team members without owner-only billing controls.",
    badge: "Admin",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    metrics: [
      { label: "Invoice Pipeline", value: "28", change: "11 sent", trend: "up", icon: FileText },
      { label: "Outstanding", value: currency.format(36000), change: "4 overdue", trend: "down", icon: AlertTriangle },
      { label: "Clients Managed", value: "18", change: "+3 this month", trend: "up", icon: Users },
      { label: "Webhook Health", value: "99.9%", change: "Stable", trend: "up", icon: ShieldCheck },
    ],
    permissions: [
      "Create and update clients, invoices, plans, and subscriptions",
      "Invite members and read-only observers",
      "Export revenue, invoice, and subscription reports",
      "Review audit logs and payment retry activity",
    ],
    actions: ["Create invoice", "Add client", "Invite member", "Export CSV"],
  },
  member: {
    title: "Member Dashboard",
    eyebrow: "Assigned client workspace",
    description: "Work on assigned clients, prepare draft invoices, and monitor payments routed to your queue.",
    badge: "Member",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    metrics: [
      { label: "Assigned Clients", value: "8", change: "2 need updates", trend: "up", icon: Users },
      { label: "Draft Invoices", value: "5", change: "Ready to review", trend: "up", icon: FileText },
      { label: "Paid Invoices", value: "12", change: "+4 this week", trend: "up", icon: CheckCircle2 },
      { label: "Pending Payments", value: currency.format(18000), change: "2 invoices", trend: "down", icon: Clock3 },
    ],
    permissions: [
      "View and update assigned client details",
      "Create invoice drafts for assigned clients",
      "Send permitted invoices through the billing workflow",
      "View payments and subscription announcements",
    ],
    actions: ["Draft invoice", "Update client notes", "View payments"],
  },
  read_only: {
    title: "Read-Only Dashboard",
    eyebrow: "Observer and compliance view",
    description: "Inspect tenant-scoped billing activity, invoices, payments, and reports with write actions disabled.",
    badge: "Read-Only",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    metrics: [
      { label: "Revenue Viewed", value: currency.format(250000), change: "Current period", trend: "up", icon: CreditCard },
      { label: "Open Invoices", value: "13", change: "View only", trend: "down", icon: FileText },
      { label: "Active Plans", value: "6", change: "No edits", trend: "up", icon: Lock },
      { label: "Audit Events", value: "1,284", change: "Append-only", trend: "up", icon: ShieldCheck },
    ],
    permissions: [
      "View clients, invoices, payments, reports, and audit activity",
      "Download allowed reports and invoice PDFs",
      "Inspect subscription and webhook status",
      "Cannot create, edit, revoke, void, or invite users",
    ],
    actions: ["View reports", "Download PDF", "Inspect audit log"],
  },
};

const revenueTrend = [
  { month: "Jul", revenue: 48 },
  { month: "Aug", revenue: 54 },
  { month: "Sep", revenue: 49 },
  { month: "Oct", revenue: 66 },
  { month: "Nov", revenue: 72 },
  { month: "Dec", revenue: 88 },
  { month: "Jan", revenue: 82 },
  { month: "Feb", revenue: 94 },
  { month: "Mar", revenue: 102 },
  { month: "Apr", revenue: 112 },
  { month: "May", revenue: 121 },
  { month: "Jun", revenue: 134 },
];

const invoices = [
  { id: "ACME-2026-0042", client: "ABC Restaurant", amount: 34220, status: "sent", due: "Jun 10" },
  { id: "ACME-2026-0041", client: "Pixel Studio", amount: 15000, status: "paid", due: "May 30" },
  { id: "ACME-2026-0040", client: "Nova Software", amount: 50000, status: "overdue", due: "May 25" },
  { id: "ACME-2026-0039", client: "Beta Retail", amount: 24500, status: "draft", due: "Jun 18" },
];

const clients = [
  { name: "Nova Software", revenue: 210000, percent: 92 },
  { name: "Pixel Studio", revenue: 168000, percent: 74 },
  { name: "ABC Restaurant", revenue: 128000, percent: 56 },
  { name: "Beta Retail", revenue: 92000, percent: 41 },
  { name: "Atlas Media", revenue: 76000, percent: 34 },
];

const activity = [
  { label: "Invoice ACME-2026-0042 sent", detail: "ABC Restaurant", time: "12 min ago" },
  { label: "Payment confirmed", detail: "Pixel Studio paid ACME-2026-0041", time: "1 hr ago" },
  { label: "Subscription renewal queued", detail: "Nova Software yearly plan", time: "3 hrs ago" },
  { label: "Audit entry recorded", detail: "Tenant-scoped API key request", time: "Yesterday" },
];

const statusClass = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-rose-50 text-rose-700",
  void: "bg-zinc-100 text-zinc-700",
};

const normalizeRole = (role) => (role === "read-only" ? "read_only" : role || "member");

const Sparkline = () => {
  const points = revenueTrend
    .map((item, index) => `${(index / (revenueTrend.length - 1)) * 100},${100 - item.revenue / 1.45}`)
    .join(" ");

  return (
    <div className="h-72">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#revenueFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-3 grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500">
        {revenueTrend.filter((_, index) => index % 2 === 0).map((item) => (
          <span key={item.month}>{item.month}</span>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ metric }) => {
  const Icon = metric.icon;
  const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Icon size={20} />
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${metric.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
          <TrendIcon size={14} />
          {metric.change}
        </span>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
    </div>
  );
};

const Dashboard = () => {
  const { user, localInvitations, acceptLocalInvitation, declineLocalInvitation } = useAuth();

  const pendingInvite = localInvitations?.find(
    (invite) => invite.email.toLowerCase() === user?.email?.toLowerCase() && invite.status === "pending"
  );

  if (pendingInvite) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] max-w-md w-full flex flex-col gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold mx-auto shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-[32px]">forward_to_inbox</span>
          </div>

          <div>
            <h3 className="font-heading text-xl font-black text-slate-900 tracking-tight">Workspace Invitation</h3>
            <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-wider">Role & Privilege Upgrade</p>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            You have received a secure invitation to join organization <strong className="text-indigo-600">{pendingInvite.orgName}</strong> with the privilege authorization of <strong className="text-indigo-600 uppercase">{pendingInvite.role}</strong>.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Target User:</span>
              <span className="text-slate-700">{user?.email}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Assigned Privilege:</span>
              <span className="text-slate-700 uppercase">{pendingInvite.role}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Workspace Tenant:</span>
              <span className="text-slate-700">{pendingInvite.orgName}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => declineLocalInvitation(pendingInvite.id)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-100"
            >
              Decline Request
            </button>
            <button
              onClick={() => acceptLocalInvitation(pendingInvite.id)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-indigo-100 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Accept & Launch
            </button>
          </div>
        </div>
      </div>
    );
  }

  const role = normalizeRole(user?.role);

  if (role === "owner") return <OwnerDashboard />;
  if (role === "admin") return <AdminDashboard />;
  if (role === "member") return <MemberDashboard />;
  if (role === "read_only") return <ReadOnlyDashboard />;

  const config = roleConfig[role] || roleConfig.member;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${config.badgeClass}`}>{config.badge}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Tenant scoped
            </span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{config.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{config.description}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Workspace</p>
          <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{user?.organization?.name || "BillNest Workspace"}</p>
          <p className="mt-1 text-xs text-slate-500">{user?.email || "Authenticated user"}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Revenue Trend</h2>
              <p className="text-sm text-slate-500">Last 12 months, tenant-isolated aggregation</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">+21.8%</span>
          </div>
          <Sparkline />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Role Permissions</h2>
          <div className="mt-4 space-y-3">
            {config.permissions.map((permission) => (
              <div key={permission} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <p className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-300">{permission}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {config.actions.map((action) => (
              <span key={action} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {action}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Recent Invoices</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-3 font-black">Invoice</th>
                  <th className="py-3 font-black">Client</th>
                  <th className="py-3 font-black">Amount</th>
                  <th className="py-3 font-black">Due</th>
                  <th className="py-3 font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-4 font-black text-slate-900 dark:text-white">{invoice.id}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{invoice.client}</td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{currency.format(invoice.amount)}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{invoice.due}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${statusClass[invoice.status]}`}>{invoice.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Top Clients</h2>
          <div className="mt-4 space-y-4">
            {clients.map((client) => (
              <div key={client.name}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                  <span className="font-black text-slate-900 dark:text-white">{currency.format(client.revenue)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${client.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="text-indigo-600 dark:text-indigo-300" size={20} />
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Recent Activity</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {activity.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex justify-between gap-4">
                <p className="font-black text-slate-900 dark:text-white">{item.label}</p>
                <span className="shrink-0 text-xs font-bold text-slate-500">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {pendingInvite && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-indigo-200 bg-white p-5 shadow-modal dark:border-indigo-500/30 dark:bg-slate-900">
          <h3 className="font-black text-slate-950 dark:text-white">Workspace Invitation</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            You have been invited to join {pendingInvite.orgName} as {pendingInvite.role}.
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => acceptLocalInvitation(pendingInvite.id)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700">
              Accept
            </button>
            <button onClick={() => declineLocalInvitation(pendingInvite.id)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
