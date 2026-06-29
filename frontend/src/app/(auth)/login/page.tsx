"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";
import { useTheme } from "@/lib/theme";
import { Shield, Phone, Key, ArrowRight, Sun, Moon, Globe } from "lucide-react";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("error"));
      setDevOtp(data.devOtp ?? null);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otpCode: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("error"));
      router.push("/dashboard/assets");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />

      {/* Top controls */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
        <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="btn-ghost text-xs py-2 px-3">
          <Globe className="w-3.5 h-3.5" />
          {lang}
        </button>
        <button onClick={toggleTheme} className="btn-ghost py-2 px-3">
          {theme === "dark"
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-violet-500" />}
        </button>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="glass-card p-8" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>KeeperHub 2.0</h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t("login_subtitle")}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-gradient-to-r from-violet-600 to-blue-500" : "bg-[var(--card-border)]"}`} />
            <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-gradient-to-r from-violet-600 to-blue-500" : "bg-[var(--card-border)]"}`} />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              ⚠ {error}
            </div>
          )}

          {devOtp && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
              <span className="font-bold">Dev OTP:</span> <span className="text-lg font-mono tracking-widest ml-1">{devOtp}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("phone_number")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+628123456789"
                    required
                    className="input-glass pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? (
                  <span className="animate-pulse">{t("loading")}</span>
                ) : (
                  <><span>{t("request_otp")}</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("otp_code")}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="input-glass pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? (
                  <span className="animate-pulse">{t("loading")}</span>
                ) : (
                  <><span>{t("verify_otp")}</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <button type="button" onClick={() => { setStep(1); setDevOtp(null); setError(""); }}
                className="btn-ghost w-full justify-center text-xs py-2">
                ← {t("phone_number")}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: "var(--text-muted)" }}>
          KeeperHub 2.0 · Multi-Tenant Asset Management
        </p>
      </div>
    </div>
  );
}
