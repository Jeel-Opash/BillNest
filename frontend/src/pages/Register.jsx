import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ─── decoupled reusable input wrapper ─── */
const Field = ({
  label,
  name,
  type = "text",
  placeholder,
  required,
  icon,
  rightSlot,
  hint,
  formData,
  touched,
  errors,
  onChange,
  onBlur
}) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div className={`relative border rounded-xl bg-slate-50/50 transition-colors ${
      touched[name] && errors[name]
        ? "border-rose-300 focus-within:border-rose-400"
        : "border-slate-200 focus-within:border-indigo-500"
    }`}>
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
          {icon}
        </span>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className={`w-full ${icon ? "pl-9" : "pl-3"} ${rightSlot ? "pr-10" : "pr-3"} py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl`}
        value={formData[name] || ""}
        onChange={onChange}
        onBlur={onBlur}
      />
      {rightSlot}
    </div>
    {hint && !errors[name] && <p className="text-[9px] text-slate-400 font-medium">{hint}</p>}
    {touched[name] && errors[name] && (
      <p className="text-[9px] text-rose-500 font-semibold flex items-center gap-1">
        <span className="material-symbols-outlined text-[11px]">error</span>
        {errors[name]}
      </p>
    )}
  </div>
);

const Register = () => {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatar: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Weak", color: "bg-rose-500" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const avatarPresets = [
    { name: "Tech Owl", emoji: "🦉" },
    { name: "Admin Ninja", emoji: "🥷" },
    { name: "Code Wizard", emoji: "🧙" },
    { name: "Finance Lion", emoji: "🦁" },
    { name: "SaaS Rocket", emoji: "🚀" },
  ];

  const evaluatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const map = [
      { text: "Too weak", color: "bg-rose-500" },
      { text: "Weak", color: "bg-rose-400" },
      { text: "Medium", color: "bg-amber-500" },
      { text: "Strong", color: "bg-emerald-500" },
      { text: "Excellent", color: "bg-teal-500" },
    ];
    return { score, ...map[score] };
  };

  const validateField = (name, value) => {
    let err = "";
    if (name === "fullName") {
      if (!value) err = "Full name is required.";
      else if (value.length < 3) err = "Must be at least 3 characters.";
    }
    if (name === "username") {
      if (!value) err = "Username is required.";
      else if (value.length < 3) err = "Must be at least 3 characters.";
      else if (!/^[A-Za-z0-9_]+$/.test(value)) err = "Letters, numbers, and underscores only.";
    }
    if (name === "email") {
      if (!value) err = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(value)) err = "Enter a valid email address.";
    }
    if (name === "password") {
      if (!value) err = "Password is required.";
      else if (value.length < 8) err = "Must be at least 8 characters.";
    }
    if (name === "confirmPassword") {
      if (value !== formData.password) err = "Passwords do not match.";
    }
    if (name === "phone") {
      if (value && !/^\+?[0-9\s-]{8,15}$/.test(value)) err = "Enter a valid phone number.";
    }
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (name === "password") {
      setPasswordStrength(evaluatePasswordStrength(value));
      if (formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: value !== formData.confirmPassword ? "Passwords do not match." : ""
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; validateField(k, formData[k]); });
    setTouched(allTouched);
    const hasErrors = Object.values(errors).some(err => !!err);
    if (hasErrors || !agreeTerms) {
      if (!agreeTerms) showToast("You must agree to the Terms of Service.", "warning");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await register(
        formData.fullName,
        formData.username,
        formData.email,
        formData.password,
        formData.phone,
        formData.avatar || avatarPresets[0].emoji,
        ""
      );
      if (res.success) {
        showToast("Account registered! Redirecting to onboarding.", "success");
        navigate("/welcome");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };



  const strengthColors = ["bg-slate-200", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500"];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans antialiased text-slate-700">

      {/* ── FORM PANEL ── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-12 overflow-y-auto">

        {/* Logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">BN</div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">BillNest</span>
        </div>

        <div className="w-full max-w-[480px] pt-4">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create an account</h2>
            <p className="text-sm text-slate-400 mt-1.5">Set up your profile to initialize your workspace tenant.</p>
          </div>

          {/* Card — same shadow/border as dashboard */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-5">

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  name="fullName"
                  placeholder="e.g. Jeel Opash"
                  required
                  icon="person"
                  formData={formData}
                  touched={touched}
                  errors={errors}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <Field
                  label="Username"
                  name="username"
                  placeholder="e.g. jeel_opash"
                  required
                  icon="alternate_email"
                  formData={formData}
                  touched={touched}
                  errors={errors}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Work Email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  icon="mail"
                  formData={formData}
                  touched={touched}
                  errors={errors}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <Field
                  label="Phone"
                  name="phone"
                  placeholder="+91 9876543210"
                  icon="phone"
                  formData={formData}
                  touched={touched}
                  errors={errors}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className={`relative border rounded-xl bg-slate-50/50 transition-colors ${touched.password && errors.password ? "border-rose-300" : "border-slate-200 focus-within:border-indigo-500"
                  }`}>
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min. 8 characters"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-transparent text-xs font-semibold placeholder-slate-400 text-slate-700 outline-none rounded-xl"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>

                {/* Strength meter */}
                {formData.password && (
                  <div className="space-y-1 mt-1.5">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`flex-1 rounded-full transition-all ${i < passwordStrength.score ? passwordStrength.color : "bg-slate-100"}`} />
                      ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400">
                      Strength: <span className="text-slate-700">{passwordStrength.text}</span>
                    </p>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p className="text-[9px] text-rose-500 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">error</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <Field
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                required
                icon="lock"
                formData={formData}
                touched={touched}
                errors={errors}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />

              {/* Avatar picker */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Avatar <span className="font-normal opacity-60">(optional)</span>
                </label>
                <div className="flex gap-2">
                  {avatarPresets.map(preset => {
                    const isSelected = formData.avatar === preset.emoji;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: preset.emoji }))}
                        title={preset.name}
                        className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all border cursor-pointer ${isSelected
                          ? "bg-indigo-50 border-indigo-400 shadow-sm scale-110"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                      >
                        {preset.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-[11px] text-slate-500 leading-relaxed cursor-pointer select-none">
                  I agree to the{" "}
                  <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Terms of Service</span>
                  {" "}and acknowledge all tenant records are strictly isolated.
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer shadow-sm outline-none border-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Initialising…
                  </>
                ) : (
                  <>
                    Initialize Portal Account
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Login CTA */}
            <p className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
            </p>

          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-4 pb-8">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-full">
              <span className="material-symbols-outlined text-[14px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Tenant Isolated</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
