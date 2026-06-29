"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-700">{t("app_name")}</h1>
            <p className="text-sm text-gray-500">{t("login_subtitle")}</p>
          </div>
          <button
            onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
            className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition"
          >
            {lang === "ID" ? "🇮🇩 ID" : "🇺🇸 EN"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {devOtp && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
            <strong>Dev OTP:</strong> {devOtp}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-sm font-medium text-gray-600">{t("step_1")}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("phone_number")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+628123456789"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
            >
              {loading ? t("loading") : t("request_otp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm font-medium text-gray-600">{t("step_2")}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("otp_code")}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition text-center text-xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
            >
              {loading ? t("loading") : t("verify_otp")}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setDevOtp(null); setError(""); }}
              className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition"
            >
              ← {t("phone_number")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
