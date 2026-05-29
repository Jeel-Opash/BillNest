import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Lock, ArrowRight, ShieldCheck, Mail, Briefcase } from "lucide-react";
import axios from "axios";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { acceptInvite, showToast } = useAuth();


  useEffect(() => {
    if (!token) {
      showToast("No invitation token provided. Please check your link.", "error");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !name || !password) return;

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await acceptInvite(token, name, password);
      if (res.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div 
        className="floating-bg-circle" 
        style={{
          width: "400px",
          height: "400px",
          top: "15%",
          right: "15%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)"
        }}
      />

      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <ShieldCheck size={32} style={{ color: "var(--accent-secondary)", filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))" }} />
            <span>BillNest Team</span>
          </div>
          <p className="auth-subtitle">Accept Invitation & Set Up Profile</p>
        </div>

        <div className="glass-panel auth-card">
          <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", fontWeight: "700" }}>Join Organization</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "28px" }}>
            Create your account credentials to join your team workspace.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Display Name</label>
              <div className="input-wrapper">
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Rohini Sharma"
                  className="form-input has-icon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <User size={18} className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Create Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  className="form-input has-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock size={18} className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat your password"
                  className="form-input has-icon"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock size={18} className="form-input-icon" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-block"
              style={{ marginTop: "8px" }}
            >
              {isSubmitting ? (
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin-slow 0.8s linear infinite"
                }} />
              ) : (
                <>
                  Complete Account Setup <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer-text">
          Want to access an existing account?{" "}
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/login")} className="auth-link">
            Log In
          </span>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
