import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const features = [
  { icon: "receipt_long", title: "Smart Invoice Builder", desc: "Create professional invoices with line items, tax, discounts, and auto-numbering. Send via email with one click." },
  { icon: "autorenew", title: "Subscription Billing", desc: "Set up recurring billing plans with monthly/yearly cycles. Auto-generate invoices via BullMQ cron jobs." },
  { icon: "verified_user", title: "Multi-Tenant Isolation", desc: "Every organization gets a fully isolated workspace. Zero cross-tenant data leakage guaranteed." },
  { icon: "analytics", title: "Revenue Analytics", desc: "Track MRR, outstanding payments, and revenue trends with real-time charts and KPI dashboards." },
  { icon: "badge", title: "Role-Based Access", desc: "Owner → Admin → Member → Read-Only. Granular permissions for every team member." },
  { icon: "payments", title: "Stripe Integration", desc: "Accept payments via Stripe in test mode. Idempotent webhook handling for payment events." },
];

const plans = [
  { name: "Free", price: "₹0", period: "/mo", features: ["1 Organization", "5 Clients", "10 Invoices/mo", "Basic Reports", "Email Support"], cta: "Get Started", highlight: false },
  { name: "Starter", price: "₹999", period: "/mo", features: ["1 Organization", "50 Clients", "Unlimited Invoices", "Subscription Plans", "Stripe Payments", "Priority Support"], cta: "Start Free Trial", highlight: true },
  { name: "Pro", price: "₹2,999", period: "/mo", features: ["Unlimited Orgs", "Unlimited Clients", "Advanced Analytics", "API Access", "Custom Branding", "Dedicated Support"], cta: "Contact Sales", highlight: false },
];

const stats = [
  { value: "10,000+", label: "Invoices Generated" },
  { value: "500+", label: "Organizations" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "₹2Cr+", label: "Revenue Processed" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              BN
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">BillNest</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#stats" className="hover:text-indigo-600 transition-colors">About</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
              Get Started Free
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-slate-600">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link to="/login" className="text-sm font-bold text-slate-600">Sign In</Link>
            <Link to="/register" className="bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl text-center">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
            Multi-Tenant SaaS Billing Platform
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Invoice, Bill & Grow<br />
            <span className="text-indigo-600">Your Business</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            BillNest is a production-grade multi-tenant invoicing and subscription billing platform. Manage clients, automate recurring billing, and track revenue — all in one isolated workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              Start for Free
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link
              to="/login"
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px] text-slate-400">login</span>
              Sign In
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-6 font-semibold">No credit card required · Free forever plan available</p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-16 relative z-10">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/80 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="flex-1 mx-4 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono">
                app.billnest.io/dashboard
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: "₹8,50,000", color: "text-slate-900", badge: "+12.5%", badgeColor: "bg-emerald-50 text-emerald-700" },
                { label: "MRR", value: "₹1,25,000", color: "text-indigo-600", badge: "3 Active", badgeColor: "bg-indigo-50 text-indigo-700" },
                { label: "Outstanding", value: "₹20,000", color: "text-slate-900", badge: "Dunning", badgeColor: "bg-amber-50 text-amber-700" },
                { label: "ARPU", value: "₹41,667", color: "text-slate-900", badge: "Stable", badgeColor: "bg-slate-50 text-slate-600" },
              ].map((kpi, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{kpi.label}</p>
                  <p className={`text-xl font-extrabold ${kpi.color} mb-2`}>{kpi.value}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${kpi.badgeColor}`}>{kpi.badge}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-900">Revenue Trend</span>
                  <span className="text-xs text-slate-400 font-semibold">Last 12 months</span>
                </div>
                <svg className="w-full h-24" preserveAspectRatio="none" viewBox="0 0 500 60">
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 50 C 60 52, 100 40, 150 42 C 200 44, 250 28, 300 30 C 350 32, 400 14, 480 10" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 0 50 C 60 52, 100 40, 150 42 C 200 44, 250 28, 300 30 C 350 32, 400 14, 480 10 L 480 60 L 0 60 Z" fill="url(#heroGrad)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-indigo-200 text-sm font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything you need to bill smarter</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">A complete billing infrastructure built for modern SaaS businesses with enterprise-grade security and multi-tenant isolation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Invoice State Machine Visual */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Smart Invoice State Machine</h2>
          <p className="text-slate-500 text-lg mb-12">Every invoice follows a strict lifecycle. No skipping states, no data corruption.</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
              { label: "→", color: "text-slate-400 bg-transparent border-transparent text-xl font-bold" },
              { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "→", color: "text-slate-400 bg-transparent border-transparent text-xl font-bold" },
              { label: "Paid ✓", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            ].map((s, i) => (
              <div key={i} className={`px-5 py-2.5 rounded-xl border font-bold text-sm ${s.color}`}>{s.label}</div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {[
              { label: "", color: "bg-transparent border-transparent" },
              { label: "", color: "bg-transparent border-transparent" },
              { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "→", color: "text-slate-400 bg-transparent border-transparent text-xl font-bold" },
              { label: "Overdue ⚠", color: "bg-amber-50 text-amber-700 border-amber-200" },
            ].map((s, i) => (
              <div key={i} className={`px-5 py-2.5 rounded-xl border font-bold text-sm ${s.color}`}>{s.label}</div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {[
              { label: "", color: "bg-transparent border-transparent" },
              { label: "", color: "bg-transparent border-transparent" },
              { label: "Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "→", color: "text-slate-400 bg-transparent border-transparent text-xl font-bold" },
              { label: "Void ✕", color: "bg-red-50 text-red-700 border-red-200" },
            ].map((s, i) => (
              <div key={i} className={`px-5 py-2.5 rounded-xl border font-bold text-sm ${s.color}`}>{s.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 text-lg">Start free, scale as you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-2xl border p-8 flex flex-col gap-6 transition-all ${plan.highlight ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200 scale-[1.02]" : "bg-white border-slate-200 shadow-sm"}`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                    <span className={`text-sm font-semibold ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>{plan.period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2.5 text-sm font-semibold ${plan.highlight ? "text-indigo-100" : "text-slate-600"}`}>
                      <span className={`material-symbols-outlined text-[16px] ${plan.highlight ? "text-indigo-300" : "text-emerald-500"}`}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${plan.highlight ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to streamline your billing?</h2>
          <p className="text-indigo-200 text-lg mb-10">Join hundreds of businesses using BillNest to automate invoicing and grow revenue.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl text-base hover:bg-indigo-50 transition-all shadow-lg"
          >
            Create Free Account
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">BN</div>
            <span className="font-bold text-white text-sm">BillNest</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">© 2025 BillNest. Multi-Tenant SaaS Billing Platform. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
