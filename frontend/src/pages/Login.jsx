import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const savedIdentifier = localStorage.getItem("bn_remember_identifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast("Email/Username and password are required.", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await login(identifier, password);
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem("bn_remember_identifier", identifier);
        } else {
          localStorage.removeItem("bn_remember_identifier");
        }
        if (res.user && !res.user.organization) {
          navigate("/welcome");
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans antialiased text-slate-700">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col bg-white border-r border-slate-100 p-10 relative overflow-hidden">

        {/* Background blobs — identical to Register */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

        {/* Logo — identical to Register left panel */}
        <div className="flex items-center gap-2.5 z-10 mb-12">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            BN
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">BillNest</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Enterprise Plan</p>
          </div>
        </div>

        {/* Content — same structure as Register left panel */}
        <div className="z-10 flex-1 flex flex-col justify-center gap-8">

          {/* Badge + headline + sub */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              Secure Tenant Isolation
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Your billing command centre, always on.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in to access multi-tenant invoicing, recurring subscriptions, live MRR analytics and full RBAC from your isolated workspace.
            </p>
          </div>

          {/* Dashboard preview card — same bg-white border-slate-100 rounded-2xl shadow as Register's checklist card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform MRR (Demo)</p>
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                +18.4%
              </div>
            </div>
            <div className="p-4 space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹1,48,620</h3>

              {/* Sparkline */}
              <div className="flex items-end gap-1 h-10">
                {[30, 45, 38, 60, 55, 72, 80, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all ${i === 7 ? "bg-indigo-600" : i >= 5 ? "bg-indigo-200" : "bg-slate-100"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* Recent invoices — same row style as Register's checklist rows */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Invoices</p>
                {[
                  { name: "Acme Corp",   amount: "₹4,500", status: "Paid",    color: "bg-emerald-50 border-emerald-100 text-emerald-600" },
                  { name: "Globex Ltd",  amount: "₹2,100", status: "Paid",    color: "bg-emerald-50 border-emerald-100 text-emerald-600" },
                  { name: "Initech Inc", amount: "₹1,800", status: "Overdue", color: "bg-rose-50 border-rose-100 text-rose-600" },
                ].map(({ name, amount, status, color }) => (
                  <div key={name} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px] text-indigo-600">receipt_long</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-slate-900">{amount}</span>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${color}`}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer — identical to Register */}
        <div className="z-10 pt-6 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>© 2026 BillNest</span>
          <div className="flex gap-3">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">BN</div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">BillNest</span>
        </div>

        <div className="w-full max-w-[420px]">

          {/* Page header — same typography as Register */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1.5">Sign in to your workspace portal.</p>
          </div>

          {/* Form card — exact same bg-white border-slate-100 rounded-3xl shadow as Register */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-5">

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email / Username — same input style as Register */}
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

              {/* Password — same input style as Register */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-indigo-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative border border-slate-200 focus-within:border-indigo-500 rounded-xl bg-slate-50/50 transition-colors">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me — same checkbox style as Register's terms checkbox */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-[11px] text-slate-500 cursor-pointer select-none font-medium">
                  Keep me signed in on this device
                </label>
              </div>

              {/* Submit — exact same button as Register */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer shadow-sm outline-none border-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Authorizing…
                  </>
                ) : (
                  <>
                    Access Workspace Portal
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>

            </form>

            {/* Divider — identical to Register */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Register CTA — same footer text as Register's "Sign in" link */}
            <p className="text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Create workspace
              </Link>
            </p>

          </div>

          {/* Trust badges — identical to Register */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-full">
              <span className="material-symbols-outlined text-[14px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">SOC 2 Ready</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
