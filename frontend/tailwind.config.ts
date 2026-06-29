import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          purple: "#7c3aed",
          blue: "#3b82f6",
          cyan: "#06b6d4",
          green: "#10b981",
          amber: "#f59e0b",
          pink: "#ec4899",
        },
        dark: {
          bg: "#080c14",
          surface: "#0d1629",
          card: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.08)",
          sidebar: "#060a12",
        },
        light: {
          bg: "#f0f4ff",
          surface: "#ffffff",
          card: "rgba(255,255,255,0.85)",
          border: "rgba(0,0,0,0.08)",
          sidebar: "#ffffff",
        },
      },
      backgroundImage: {
        "dark-gradient": "linear-gradient(135deg, #080c14 0%, #0d1629 50%, #080c14 100%)",
        "light-gradient": "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "purple-glow": "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "blue-glow": "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-light": "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
        "glow-purple": "0 0 20px rgba(124,58,237,0.4)",
        "glow-blue": "0 0 20px rgba(59,130,246,0.4)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(-10px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
