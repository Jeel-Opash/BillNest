import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState("owner");
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !agreeTerms) return;
    if (selectedRole === "owner" && !organizationName) return;

    try {
      setIsSubmitting(true);
      const finalOrgName = selectedRole === "owner" ? organizationName : `${fullName}'s Workspace`;
      const res = await register(finalOrgName, fullName, email, password, selectedRole);
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
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl z-10 flex flex-col gap-6">
        
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-headline-lg font-display-lg font-bold text-on-background">BillNest</span>
          </div>
          <p className="text-on-surface-variant text-body-md">
            Deploy secure isolated workspaces for multi-tenant SaaS billing.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-lg flex flex-col gap-6">
          <div>
            <h3 className="text-headline-md text-on-surface font-bold text-center">Register Workspace</h3>
            <p className="text-xs text-on-surface-variant text-center mt-1">Configure your role credentials and initialize your isolated context.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                <input 
                  type="text" 
                  required 
                  placeholder="Jeel Opash" 
                  className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input 
                  type="email" 
                  required 
                  placeholder="jm.opash@gmail.com" 
                  className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

             <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {selectedRole === "owner" && (
              <div className="animate-fade-in transition-all">
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Organization Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">corporate_fare</span>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Acme Corporation" 
                    className="w-full bg-surface-container-low border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary/20" 
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-label-sm font-bold text-on-surface-variant">Workspace Privilege Assignment</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "owner", title: "Owner", desc: "Initialize new organization", symbol: "crown" },
                  { id: "member", title: "Member", desc: "Join an existing workspace", symbol: "groups" }
                ].map(role => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <div 
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center flex flex-col items-center gap-1.5 transition-all duration-150 ${
                        isSelected 
                          ? "bg-secondary-fixed border-primary text-on-secondary-fixed scale-[0.98]" 
                          : "bg-surface-container-low border-outline-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{role.symbol}</span>
                      <div>
                        <h4 className="font-bold text-xs">{role.title}</h4>
                        <p className="text-[9px] text-on-surface-variant opacity-80 mt-0.5">{role.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                required 
                className="rounded mt-0.5 text-primary focus:ring-primary/20"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-xs text-on-surface-variant leading-relaxed">
                I agree to the <strong className="text-primary">Terms of Service</strong> and acknowledge that all tenant database records are strictly isolated.
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {isSubmitting ? "Configuring Tenant Workspace..." : "Initialize Workspace Portal"}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

          </form>

          <p className="text-center text-xs text-on-surface-variant">
            Already have an active tenant?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default Register;
