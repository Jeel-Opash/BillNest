import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-6 relative overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">

        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-headline-lg font-display-lg font-bold text-on-background">BillNest</span>
          </div>
          <p className="text-on-surface-variant text-body-md">
            Enterprise SaaS Billing & Tenant Isolation Platform
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-lg flex flex-col gap-6">
          <div>
            <h3 className="text-headline-md text-on-surface font-bold text-center">Welcome Back</h3>
            <p className="text-xs text-on-surface-variant text-center mt-1">Enter your credentials to access your organization workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-label-sm font-bold text-on-surface-variant">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input type={showPassword ? "text" : "password"}
                  required placeholder="••••••••"
                  className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-12 py-3 text-body-sm focus:ring-2 focus:ring-primary/20"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded text-primary focus:ring-primary/20"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {isSubmitting ? "Signing in..." : "Access Workspace"}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

          </form>

          <p className="text-center text-xs text-on-surface-variant">
            Don't have an organization?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline">Create an Organization</Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default Login;
