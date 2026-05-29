import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-sans)"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(255,255,255,0.05)",
          borderTopColor: "var(--accent-primary)",
          borderRadius: "50%",
          animation: "spin-slow 1s linear infinite"
        }}></div>
        <p style={{ marginTop: "16px", fontWeight: 500, letterSpacing: "0.05em" }}>LOADING BILLNEST...</p>
      </div>
    );
  }

  if (!user) {

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
