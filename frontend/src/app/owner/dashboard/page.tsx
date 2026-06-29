"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/i18nContext";
import {
  CheckCircle2, AlertTriangle, X, Crown,
  Building2, Car, Cpu, Gem, Boxes,
  ArrowRight, Sparkles,
} from "lucide-react";

interface Asset {
  id: string;
  assetName: string;
  category: string;
  purchaseDate: string;
  purchasePrice: string;
}

interface Subscription {
  planType: "BASIC" | "SULTAN";
  isActive: boolean;
}

const CATEGORIES = ["PROPERTY", "VEHICLE", "ELECTRONIC", "LUXURY_GOODS"] as const;
type Category = typeof CATEGORIES[number];

const CAT_META: Record<Category, { icon: typeof Building2; label_id: string; label_en: string; color: string }> = {
  PROPERTY:     { icon: Building2, label_id: "Properti",    label_en: "Property",     color: "#7c3aed" },
  VEHICLE:      { icon: Car,       label_id: "Kendaraan",   label_en: "Vehicle",      color: "#3b82f6" },
  ELECTRONIC:   { icon: Cpu,       label_id: "Elektronik",  label_en: "Electronic",   color: "#06b6d4" },
  LUXURY_GOODS: { icon: Gem,       label_id: "Barang Mewah",label_en: "Luxury Goods", color: "#f59e0b" },
};

interface FormState {
  assetName: string;
  category: Category;
  purchaseDate: string;
  purchasePrice: string;
  warrantyEndDate: string;
  taxationDeadline: string;
}

interface FormErrors {
  assetName?: string;
  purchasePrice?: string;
  purchaseDate?: string;
}

const EMPTY_FORM: FormState = {
  assetName: "", category: "PROPERTY", purchaseDate: "",
  purchasePrice: "", warrantyEndDate: "", taxationDeadline: "",
};

function fmt(n: number, lang: string) {
  return new Intl.NumberFormat(lang === "ID" ? "id-ID" : "en-US", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

export default function OwnerDashboardPage() {
  const { t, lang } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ar, sumRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/dashboard/summary"),
      ]);
      if (ar.ok) setAssets(await ar.json());
      if (sumRes.ok) {
        const s = await sumRes.json();
        if (s.subscription) setSubscription(s.subscription);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.assetName || form.assetName.trim().length < 2)
      e.assetName = t("validation_name");
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0)
      e.purchasePrice = t("validation_price");
    if (!form.purchaseDate)
      e.purchaseDate = t("validation_date");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice),
        }),
      });
      const data = await res.json();
      if (res.status === 402 && data.error === "PAYWALL") {
        setShowPaywall(true);
        return;
      }
      if (!res.ok) {
        setServerError(data.error ?? t("error"));
        return;
      }
      setSuccess(true);
      setForm(EMPTY_FORM);
      setErrors({});
      fetchData();
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  const isBasic = subscription?.planType === "BASIC" || !subscription;
  const assetCount = assets.length;
  const usagePercent = isBasic ? Math.min((assetCount / 3) * 100, 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {t("menu_asset_input")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {t("register_asset")}
        </p>
      </div>

      {/* Subscription Status */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{
          background: isBasic ? "rgba(124,58,237,0.05)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${isBasic ? "rgba(124,58,237,0.15)" : "rgba(245,158,11,0.2)"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isBasic ? "rgba(124,58,237,0.12)" : "rgba(245,158,11,0.12)" }}
          >
            {isBasic ? <Boxes className="w-4 h-4" style={{ color: "#7c3aed" }} /> : <Crown className="w-4 h-4" style={{ color: "#f59e0b" }} />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {isBasic ? t("plan_basic_label") : `👑 ${t("plan_sultan_label")}`}
            </p>
            {isBasic ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${usagePercent}%`,
                      background: usagePercent >= 100 ? "#ef4444" : usagePercent >= 66 ? "#f59e0b" : "#7c3aed",
                    }}
                  />
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {assetCount} / 3 {t("asset_count_label")}
                </span>
              </div>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("unlimited")}</p>
            )}
          </div>
        </div>
        {isBasic && (
          <button
            onClick={() => setShowPaywall(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all hover:opacity-80"
            style={{ background: "#7c3aed", color: "white" }}
          >
            <Sparkles className="w-3 h-3" />
            {t("upgrade_plan")}
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FORM CARD — 3 cols */}
        <div
          className="lg:col-span-3 rounded-2xl p-6"
          style={{
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
            {t("register_asset")}
          </h2>

          {/* Success banner */}
          {success && (
            <div
              className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {t("asset_registered")}
            </div>
          )}

          {/* Error banner */}
          {serverError && (
            <div
              className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Asset Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {t("asset_name")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.assetName}
                onChange={e => { setForm(f => ({ ...f, assetName: e.target.value })); setErrors(er => ({ ...er, assetName: undefined })); }}
                placeholder={lang === "ID" ? "e.g. Rumah Jakarta Selatan" : "e.g. Jakarta South House"}
                className="input-glass"
                style={errors.assetName ? { borderColor: "#ef4444" } : {}}
              />
              {errors.assetName && <p className="text-xs mt-1 text-red-400">{errors.assetName}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {t("category")} <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => {
                  const meta = CAT_META[cat];
                  const Icon = meta.icon;
                  const selected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: selected ? `${meta.color}14` : "var(--card)",
                        border: `1.5px solid ${selected ? meta.color : "var(--card-border)"}`,
                        color: selected ? meta.color : "var(--text-secondary)",
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {lang === "ID" ? meta.label_id : meta.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Price + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("purchase_price")} (IDR) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={form.purchasePrice}
                  onChange={e => { setForm(f => ({ ...f, purchasePrice: e.target.value })); setErrors(er => ({ ...er, purchasePrice: undefined })); }}
                  placeholder="0"
                  className="input-glass font-mono"
                  style={errors.purchasePrice ? { borderColor: "#ef4444" } : {}}
                />
                {errors.purchasePrice && <p className="text-xs mt-1 text-red-400">{errors.purchasePrice}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("purchase_date")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={e => { setForm(f => ({ ...f, purchaseDate: e.target.value })); setErrors(er => ({ ...er, purchaseDate: undefined })); }}
                  className="input-glass"
                  style={errors.purchaseDate ? { borderColor: "#ef4444" } : {}}
                />
                {errors.purchaseDate && <p className="text-xs mt-1 text-red-400">{errors.purchaseDate}</p>}
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("warranty_end_date")}
                </label>
                <input
                  type="date"
                  value={form.warrantyEndDate}
                  onChange={e => setForm(f => ({ ...f, warrantyEndDate: e.target.value }))}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {t("taxation_deadline")}
                </label>
                <input
                  type="date"
                  value={form.taxationDeadline}
                  onChange={e => setForm(f => ({ ...f, taxationDeadline: e.target.value }))}
                  className="input-glass"
                />
              </div>
            </div>

            {/* Preview price */}
            {form.purchasePrice && Number(form.purchasePrice) > 0 && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
                <span style={{ color: "var(--text-muted)" }}>Nilai aset: </span>
                <span className="font-semibold font-mono" style={{ color: "#7c3aed" }}>
                  {fmt(Number(form.purchasePrice), lang)}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: submitting ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7c3aed,#3b82f6)",
                color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{t("loading")}</>
              ) : (
                <>{t("save")}<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* ASSET LIST — 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("assets")}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
            >
              {assetCount}
            </span>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "var(--text-muted)" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("no_data")}</p>
            </div>
          ) : (
            assets.map((asset, i) => {
              const meta = CAT_META[asset.category as Category] ?? CAT_META.PROPERTY;
              const Icon = meta.icon;
              const GRAD = [
                ["#7c3aed","#3b82f6"],
                ["#3b82f6","#06b6d4"],
                ["#06b6d4","#10b981"],
                ["#f59e0b","#ef4444"],
              ][i % 4];
              return (
                <div
                  key={asset.id}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
                  style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${GRAD[0]}20, ${GRAD[1]}20)`, border: `1px solid ${GRAD[0]}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {asset.assetName}
                    </p>
                    <p className="text-xs truncate font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {fmt(Number(asset.purchasePrice), lang)}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: `${meta.color}15`, color: meta.color }}
                  >
                    {lang === "ID" ? meta.label_id : meta.label_en}
                  </span>
                </div>
              );
            })
          )}

          {/* Financial detail link */}
          {assets.length > 0 && (
            <a
              href="/owner/dashboard/financial"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", color: "#7c3aed" }}
            >
              {t("financial_detail")}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowPaywall(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            {/* Glow decoration */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, rgba(245,158,11,0.2), transparent)", filter: "blur(20px)" }}
            />

            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center relative z-10"
              style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <Crown className="w-8 h-8" style={{ color: "#f59e0b" }} />
            </div>

            <h2 className="text-xl font-bold mb-2 relative z-10" style={{ color: "var(--text-primary)" }}>
              {t("paywall_title")}
            </h2>
            <p className="text-sm mb-6 relative z-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {t("paywall_message")}
            </p>

            {/* Feature list */}
            <div
              className="rounded-2xl p-4 mb-6 text-left space-y-2.5 relative z-10"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
            >
              {[
                lang === "ID" ? "Aset tidak terbatas" : "Unlimited assets",
                lang === "ID" ? "Laporan finansial lengkap" : "Full financial reports",
                lang === "ID" ? "Prioritas dukungan" : "Priority support",
                lang === "ID" ? "Ekspor data (CSV/PDF)" : "Data export (CSV/PDF)",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                  {f}
                </div>
              ))}
            </div>

            <button
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] relative z-10 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "white" }}
            >
              <Crown className="w-4 h-4" />
              {t("upgrade_plan")}
            </button>
            <p className="text-xs mt-3 relative z-10" style={{ color: "var(--text-muted)" }}>
              {lang === "ID" ? "Hubungi admin untuk upgrade" : "Contact admin to upgrade"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
