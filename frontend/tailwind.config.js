/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Outfit", "Inter", "sans-serif"],
      },
      colors: {
        primary: "#4f46e5",
        "on-primary": "#ffffff",
        "primary-fixed": "#e0e7ff",
        "on-primary-fixed": "#1e1b4b",
        "on-primary-fixed-variant": "#3730a3",

        secondary: "#6366f1",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#e0e7ff",
        "on-secondary-fixed": "#1e1b4b",

        tertiary: "#7c3aed",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#ede9fe",
        "on-tertiary-fixed": "#2e1065",

        error: "#ef4444",
        "on-error": "#ffffff",

        background: "#f8fafc",
        "on-background": "#0f172a",

        surface: "#ffffff",
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",

        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container": "#f1f5f9",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",

        "outline-variant": "#e2e8f0",
        outline: "#94a3b8",

        "inverse-surface": "#1e293b",
        "inverse-on-surface": "#f1f5f9",
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "800" }],
        "headline-lg": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["1.5rem", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-sm": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.5" }],
        "body-md": ["0.875rem", { lineHeight: "1.5" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "label-lg": ["0.875rem", { lineHeight: "1.4", fontWeight: "600" }],
        "label-md": ["0.8125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "label-sm": ["0.75rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};
