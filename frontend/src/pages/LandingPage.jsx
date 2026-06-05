import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  { icon: "receipt_long", title: "Smart Invoice Builder", desc: "Create professional invoices with line items, tax, discounts, and auto-numbering. Send via email with one click." },
  { icon: "autorenew", title: "Subscription Billing", desc: "Set up recurring billing plans with monthly/yearly cycles. Auto-generate invoices via BullMQ cron jobs." },
  { icon: "verified_user", title: "Multi-Tenant Isolation", desc: "Every organization gets a fully isolated workspace. Zero cross-tenant data leakage guaranteed." },
  { icon: "analytics", title: "Revenue Analytics", desc: "Track MRR, outstanding payments, and revenue trends with real-time charts and KPI dashboards." },
  { icon: "badge", title: "Role-Based Access", desc: "Owner → Admin → Member → Read-Only. Granular permissions for every team member." },
  { icon: "payments", title: "Stripe Integration", desc: "Accept payments via Stripe in test mode. Idempotent webhook handling for payment events." },
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
  const { user, login, register, showToast } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlanSelect = (planId) => {
    if (user) {
      navigate("/dashboard");
    } else {
      setSelectedPlan(planId);
      setAuthTab("login");
      setShowAuthModal(true);
    }
  };

  const handleModalLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast("Email/Username and password are required.", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await login(identifier, password);
      if (res.success) {
        showToast("Welcome back!", "success");
        setShowAuthModal(false);
        if (res.user && !res.user.organization) {
          navigate("/welcome");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      showToast("All fields are required.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "warning");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await register(fullName, username, email, password);
      if (res.success) {
        showToast("Account registered! Welcome to BillNest.", "success");
        setShowAuthModal(false);
        navigate("/welcome");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing Plans</a>
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
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600" onClick={() => setMobileMenuOpen(false)}>Pricing Plans</a>
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

      {/* Subscription Plans */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-3">
              Pricing Plans
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Choose the right plan for your business</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Simple, transparent pricing. Scale your billing operations with confidence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: "starter",
                name: "Starter",
                price: "₹1,999",
                period: "/month",
                desc: "Essential features for freelancers and small teams starting their journey.",
                features: [
                  "5 Active Clients",
                  "50 Invoices / Month",
                  "Standard PDF Templates",
                  "Stripe Integration (Test Mode)",
                  "Email Support"
                ],
                buttonText: "Get Started",
                popular: false,
                color: "border-slate-200 bg-white"
              },
              {
                id: "growth",
                name: "Growth",
                price: "₹4,999",
                period: "/month",
                desc: "Advanced tooling for growing startups needing robust role management.",
                features: [
                  "Unlimited Clients",
                  "500 Invoices / Month",
                  "Premium Custom Branding",
                  "Priority Email & Chat Support",
                  "Role-Based Access (Owner, Admin, Member)"
                ],
                buttonText: "Choose Growth",
                popular: true,
                color: "border-indigo-600 bg-white shadow-xl shadow-indigo-100/50 relative"
              },
              {
                id: "enterprise",
                name: "Enterprise",
                price: "₹12,999",
                period: "/month",
                desc: "High volume solutions for large teams with custom compliance requirements.",
                features: [
                  "Unlimited Invoices",
                  "Dedicated Tenant Database",
                  "API Access & Webhooks",
                  "24/7 Phone Support",
                  "SLA Guarantee"
                ],
                buttonText: "Contact Sales",
                popular: false,
                color: "border-slate-800 bg-slate-900 text-white"
              }
            ].map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${plan.color}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className={`text-xl font-bold ${plan.id === "enterprise" ? "text-white" : "text-slate-900"} mb-2`}>{plan.name}</h3>
                  <p className={`text-xs ${plan.id === "enterprise" ? "text-slate-400" : "text-slate-400"} leading-relaxed mb-6`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-4xl font-extrabold ${plan.id === "enterprise" ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                    <span className={`text-xs font-semibold ${plan.id === "enterprise" ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs font-semibold">
                        <span className={`material-symbols-outlined text-[16px] ${plan.id === "enterprise" ? "text-indigo-400" : "text-indigo-600"}`}>check_circle</span>
                        <span className={plan.id === "enterprise" ? "text-slate-300" : "text-slate-600"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3.5 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 ${
                    plan.id === "enterprise"
                      ? "bg-white text-slate-900 hover:bg-indigo-50"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {plan.buttonText}
                </button>
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

      {/* Authentication Modal Popup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with backdrop-blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setShowAuthModal(false)}
          />

          {/* Modal Container */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden z-10 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Banner mentioning the selected plan */}
            <div className="bg-indigo-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">BN</div>
              <div>
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Plan Selected</p>
                <p className="text-xs font-black text-slate-800 capitalize">{selectedPlan} Plan</p>
              </div>
            </div>

            <div className="p-6">
              {/* Tab Switcher */}
              <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authTab === "login"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authTab === "register"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Login Form */}
              {authTab === "login" ? (
                <form onSubmit={handleModalLogin} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Email or Username
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        required
                        placeholder="Email address or username"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 font-sans"
                  >
                    {isSubmitting ? "Signing In..." : "Sign In & Subscribe"}
                    <span className="material-symbols-outlined text-[16px]">login</span>
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleModalRegister} className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jeel Opash"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Username
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">alternate_email</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. jeelopash"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                      <input
                        type="password"
                        required
                        placeholder="Min. 6 characters"
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 font-sans"
                  >
                    {isSubmitting ? "Creating..." : "Sign Up & Subscribe"}
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
