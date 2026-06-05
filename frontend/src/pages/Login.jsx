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

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">

        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">BN</div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">BillNest</span>
        </div>

        <div className="w-full max-w-[420px]">

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1.5">Sign in to your workspace portal.</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-5">

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <p className="text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Create workspace
              </Link>
            </p>

          </div>

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
