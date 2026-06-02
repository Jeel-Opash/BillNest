import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setIsSubmitting(true);
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
      showToast("Password reset link sent to your email!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send reset email.", "error");
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
          <p className="text-on-surface-variant text-body-md">Enterprise SaaS Billing & Tenant Isolation Platform</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-lg flex flex-col gap-6">
          {!sent ? (
            <>
              <div>
                <h3 className="text-headline-md text-on-surface font-bold text-center">Reset Password</h3>
                <p className="text-xs text-on-surface-variant text-center mt-1">Enter your work email and we'll send you a reset link.</p>
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
                      className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20 outline-none border"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="text-center flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-[32px]">mark_email_read</span>
              </div>
              <div>
                <h3 className="text-headline-md text-on-surface font-bold">Check your inbox</h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  We've sent a password reset link to <strong className="text-primary">{email}</strong>. The link expires in 15 minutes.
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-primary font-bold hover:underline"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <p className="text-center text-xs text-on-surface-variant">
            Remember your password?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
