import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedRefreshToken = localStorage.getItem("bn_refresh_token");
      const savedUser = localStorage.getItem("bn_user");
      const savedAccessToken = localStorage.getItem("bn_access_token");

      const isTokenExpired = (token) => {
        if (!token) return true;
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const { exp } = JSON.parse(jsonPayload);
          return Date.now() >= (exp * 1000) - 10000; // 10s buffer
        } catch (e) {
          return true;
        }
      };

      if (savedRefreshToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          if (savedAccessToken) {
            setToken(savedAccessToken);
          }

          if (!savedAccessToken || isTokenExpired(savedAccessToken)) {
            const res = await axios.post("/auth/refresh", {
              refreshToken: savedRefreshToken
            });

            if (res.data.success) {
              setToken(res.data.token);
              localStorage.setItem("bn_access_token", res.data.token);
              if (res.data.refreshToken) {
                localStorage.setItem("bn_refresh_token", res.data.refreshToken);
              }
            }
          }
        } catch (error) {
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Session expired on startup. Logging out silently.");
            logout(true);
          } else {
            console.error("Silent refresh failed on startup:", error);
            if (!savedAccessToken) {
              logout(true);
            }
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);


  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);


  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;


        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const savedRefreshToken = localStorage.getItem("bn_refresh_token");

          if (savedRefreshToken) {
            try {
              const res = await axios.post("/auth/refresh", {
                refreshToken: savedRefreshToken
              });

              if (res.data.success) {
                setToken(res.data.token);
                localStorage.setItem("bn_access_token", res.data.token);
                if (res.data.refreshToken) {
                  localStorage.setItem("bn_refresh_token", res.data.refreshToken);
                }


                originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
                return axios(originalRequest);
              }
            } catch (refreshError) {
              console.error("Auto refresh interceptor failed:", refreshError);
              logout();
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);


  const register = async (organizationName, name, email, password, role = "owner") => {
    try {
      setIsLoading(true);
      const res = await axios.post("/auth/register", {
        organizationName,
        name,
        email,
        password,
        role
      });

      if (res.data.success) {
        const { token: newAccessToken, refreshToken: newRefreshToken, user: userData } = res.data;
        setToken(newAccessToken);
        setUser(userData);
        localStorage.setItem("bn_refresh_token", newRefreshToken);
        localStorage.setItem("bn_access_token", newAccessToken);
        localStorage.setItem("bn_user", JSON.stringify(userData));
        showToast("Welcome to BillNest! Organization registered successfully.", "success");
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed. Please check your credentials.";
      showToast(errorMsg, "error");
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };


  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await axios.post("/auth/login", { email, password });

      if (res.data.success) {
        const { token: newAccessToken, refreshToken: newRefreshToken, user: userData } = res.data;
        setToken(newAccessToken);
        setUser(userData);
        localStorage.setItem("bn_refresh_token", newRefreshToken);
        localStorage.setItem("bn_access_token", newAccessToken);
        localStorage.setItem("bn_user", JSON.stringify(userData));
        showToast(`Welcome back, ${userData.name}!`, "info");
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid email or password.";
      showToast(errorMsg, "error");
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };


  const acceptInvite = async (inviteToken, name, password) => {
    try {
      setIsLoading(true);
      const res = await axios.post("/auth/accept-invite", {
        token: inviteToken,
        name,
        password
      });

      if (res.data.success) {
        const { token: newAccessToken, refreshToken: newRefreshToken, user: userData } = res.data;
        setToken(newAccessToken);
        setUser(userData);
        localStorage.setItem("bn_refresh_token", newRefreshToken);
        localStorage.setItem("bn_access_token", newAccessToken);
        localStorage.setItem("bn_user", JSON.stringify(userData));
        showToast("Invitation accepted! Account activated.", "success");
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to accept invitation.";
      showToast(errorMsg, "error");
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async (isSilent = false) => {
    const savedRefreshToken = localStorage.getItem("bn_refresh_token");
    if (savedRefreshToken && !isSilent) {
      try {
        await axios.post("/auth/logout", { refreshToken: savedRefreshToken });
      } catch (error) {
        console.error("Server logout error:", error);
      }
    }


    setToken(null);
    setUser(null);
    localStorage.removeItem("bn_refresh_token");
    localStorage.removeItem("bn_access_token");
    localStorage.removeItem("bn_user");
    localStorage.removeItem("bn_workspaces");
    if (!isSilent) {
      showToast("Logged out successfully.", "info");
    }
  };


  const createWorkspace = async (orgName, plan = "pro", currency = "INR", prefix = "INV") => {
    try {
      setIsLoading(true);
      const newOrgId = "org_" + Math.random().toString(36).substr(2, 9);
      const newOrg = {
        _id: newOrgId,
        name: orgName,
        slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        plan,
        currency,
        settings: { invoicePrefix: prefix }
      };

      const updatedUser = {
        ...user,
        organization: newOrg,
        tenantId: newOrgId
      };

      setUser(updatedUser);
      localStorage.setItem("bn_user", JSON.stringify(updatedUser));


      const savedWorkspaces = JSON.parse(localStorage.getItem("bn_workspaces") || "[]");

      if (user?.organization && !savedWorkspaces.some(w => w._id === user.organization._id)) {
        savedWorkspaces.push(user.organization);
      }
      if (!savedWorkspaces.some(w => w._id === newOrgId)) {
        savedWorkspaces.push(newOrg);
      }
      localStorage.setItem("bn_workspaces", JSON.stringify(savedWorkspaces));

      showToast(`Workspace '${orgName}' initialized!`, "success");
      return { success: true };
    } catch (err) {
      showToast("Failed to initialize workspace.", "error");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };


  const switchWorkspace = (org) => {
    const updatedUser = {
      ...user,
      organization: org,
      tenantId: org._id
    };
    setUser(updatedUser);
    localStorage.setItem("bn_user", JSON.stringify(updatedUser));
    showToast(`Switched active workspace: ${org.name}`, "success");
  };

  const [localInvitations, setLocalInvitations] = useState(() => {
    try {
      const saved = localStorage.getItem("billnest_invitations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addLocalInvitation = (email, role, orgName) => {
    const newInvite = {
      id: `inv_${Date.now()}`,
      email,
      role,
      orgName,
      status: "pending",
      timestamp: new Date().toISOString()
    };
    const updated = [...localInvitations, newInvite];
    setLocalInvitations(updated);
    localStorage.setItem("billnest_invitations", JSON.stringify(updated));
  };

  const acceptLocalInvitation = async (inviteId) => {
    const updatedInvites = localInvitations.map(inv =>
      inv.id === inviteId ? { ...inv, status: "accepted" } : inv
    );
    setLocalInvitations(updatedInvites);
    localStorage.setItem("billnest_invitations", JSON.stringify(updatedInvites));

    const targetInvite = localInvitations.find(inv => inv.id === inviteId);
    if (targetInvite && user) {
      try {
        const res = await axios.put("/auth/update-role", { role: targetInvite.role });
        if (res.data.success) {
          const { user: updatedUser, token: newAccessToken, refreshToken: newRefreshToken } = res.data;
          setToken(newAccessToken);
          setUser(updatedUser);
          localStorage.setItem("bn_access_token", newAccessToken);
          localStorage.setItem("bn_refresh_token", newRefreshToken);
          localStorage.setItem("bn_user", JSON.stringify(updatedUser));
          showToast(`Invitation accepted! You are now an ${targetInvite.role.toUpperCase()} of ${targetInvite.orgName}.`, "success");
        }
      } catch (err) {
        console.error("Failed to persist role in backend database:", err);
        // Fallback to local update if API fails
        const updatedUser = {
          ...user,
          role: targetInvite.role,
          organization: {
            ...user.organization,
            name: targetInvite.orgName
          }
        };
        setUser(updatedUser);
        localStorage.setItem("bn_user", JSON.stringify(updatedUser));
        showToast(`Invitation accepted locally! (DB update offline)`, "warning");
      }
    }
  };

  const declineLocalInvitation = (inviteId) => {
    const updatedInvites = localInvitations.map(inv =>
      inv.id === inviteId ? { ...inv, status: "declined" } : inv
    );
    setLocalInvitations(updatedInvites);
    localStorage.setItem("billnest_invitations", JSON.stringify(updatedInvites));
    showToast("Invitation declined.", "info");
  };

  const simulateLoginAs = (email, role, orgName, orgId = "org_mock") => {
    const mockUser = {
      _id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email: email,
      role: role,
      organization: {
        _id: orgId,
        name: orgName,
        slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        plan: "pro"
      },
      tenantId: orgId
    };
    setUser(mockUser);
    localStorage.setItem("bn_user", JSON.stringify(mockUser));
    showToast(`Session switched to ${role.toUpperCase()}: ${email}`, "success");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        acceptInvite,
        logout,
        showToast,
        toasts,
        removeToast,
        createWorkspace,
        switchWorkspace,
        localInvitations,
        addLocalInvitation,
        acceptLocalInvitation,
        declineLocalInvitation,
        simulateLoginAs
      }}
    >
      {children}

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <div className="toast-icon">
                {toast.type === "success" && (
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                )}
                {toast.type === "error" && (
                  <span className="material-symbols-outlined text-rose-500 text-[20px]">error</span>
                )}
                {toast.type === "warning" && (
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
                )}
                {toast.type === "info" && (
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">info</span>
                )}
              </div>
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
