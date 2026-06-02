import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPassword = () => {
  const { forgotPassword, resetPassword, showToast } = useAuth();


  const [stage, setStage] = useState("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [simulatedToken, setSimulatedToken] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      const res = await forgotPassword(email);
      if (res.success) {
        setSimulatedToken(res.resetToken);
        setToken(res.resetToken);
        setStage("update");
        showToast("Password reset authorization code generated!", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!token || !password || !confirmPassword) return;

    if (password.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await resetPassword(token, password);
      if (res.success) {
        setStage("success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[36px] text-indigo-400 bg-indigo-500/10 p-2 rounded-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="text-2xl font-black text-white tracking-tight">BillNest</span>
          </div>
          <p className="text-slate-400 text-xs">Enterprise SaaS Billing & Tenant Isolation Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          
          {/* STAGE 1: Request Reset */}
          {stage === "request" && (
            <>
              <div>
                <h3 className="text-lg font-black text-white text-center">Reset Password</h3>
                <p className="text-xs text-slate-400 text-center mt-1">Enter your work email and we'll initiate the recovery sequence.</p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity text-xs cursor-pointer shadow-lg outline-none"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            </>
          )}

          {/* STAGE 2: Update Password */}
          {stage === "update" && (
            <>
              <div>
                <h3 className="text-lg font-black text-white text-center">Set New Password</h3>
                <p className="text-xs text-slate-400 text-center mt-1">Configure fresh access credentials for your account.</p>
              </div>

              {simulatedToken && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-2xl flex flex-col gap-1 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    <span>Simulated Reset Dispatch (Sandbox mode)</span>
                  </div>
                  <p className="text-slate-400">
                    We generated a simulated recovery token: <strong className="text-white font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{simulatedToken}</strong>. We've pre-filled the authorization field below!
                  </p>
                </div>
              )}

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Authorization Token</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">vpn_key</span>
                    <input
                      type="text"
                      required
                      placeholder="Enter recovery code"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 flex items-center justify-center cursor-pointer outline-none"
                    >
                      <span className="material-symbols-outlined text-[16px]">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity text-xs cursor-pointer shadow-lg outline-none"
                >
                  {isSubmitting ? "Resetting Password..." : "Update Password"}
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                </button>
              </form>
            </>
          )}

          {/* STAGE 3: Success */}
          {stage === "success" && (
            <div className="text-center flex flex-col items-center gap-4 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-emerald-400 text-[32px]">check_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Password Updated</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Your credentials have been successfully updated. You can now login with your new password.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-xs cursor-pointer shadow-lg outline-none"
              >
                Access Login Page
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            Remember your password?{" "}
            <Link to="/login" className="text-indigo-400 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
