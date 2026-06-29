"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { Plus, Pencil, Trash2, Boxes, TrendingUp, X, ChevronRight } from "lucide-react";

interface Asset {
  id: string;
  assetName: string;
  category: string;
  purchaseDate: string;
  purchasePrice: string;
  totalMaintenanceCost: string;
  warrantyEndDate?: string;
  taxationDeadline?: string;
}

const CATEGORIES = ["PROPERTY", "VEHICLE", "ELECTRONIC", "LUXURY_GOODS"] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PROPERTY:     { bg: "rgba(124,58,237,0.15)", text: "#a78bfa", dot: "#7c3aed" },
  VEHICLE:      { bg: "rgba(59,130,246,0.15)", text: "#93c5fd", dot: "#3b82f6" },
  ELECTRONIC:   { bg: "rgba(6,182,212,0.15)",  text: "#67e8f9", dot: "#06b6d4" },
  LUXURY_GOODS: { bg: "rgba(245,158,11,0.15)", text: "#fcd34d", dot: "#f59e0b" },
};

export default function AssetsPage() {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetName: "", category: "PROPERTY", purchaseDate: "",
    purchasePrice: "", warrantyEndDate: "", taxationDeadline: "",
  });

  const categoryLabel: Record<string, string> = {
    PROPERTY: t("category_property"), VEHICLE: t("category_vehicle"),
    ELECTRONIC: t("category_electronic"), LUXURY_GOODS: t("category_luxury_goods"),
  };

  async function fetchAssets() {
    setLoading(true);
    const res = await fetch("/api/assets");
    if (res.ok) setAssets(await res.json());
    setLoading(false);
  }
  useEffect(() => { fetchAssets(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/assets/${editingId}` : "/api/assets";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setEditingId(null); resetForm(); fetchAssets(); }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    fetchAssets();
  }

  function handleEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      assetName: asset.assetName, category: asset.category,
      purchaseDate: asset.purchaseDate?.split("T")[0] ?? "",
      purchasePrice: asset.purchasePrice,
      warrantyEndDate: asset.warrantyEndDate?.split("T")[0] ?? "",
      taxationDeadline: asset.taxationDeadline?.split("T")[0] ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ assetName: "", category: "PROPERTY", purchaseDate: "", purchasePrice: "", warrantyEndDate: "", taxationDeadline: "" });
  }

  const totalValue = assets.reduce((s, a) => s + Number(a.purchasePrice), 0);
  const totalMaintCost = assets.reduce((s, a) => s + Number(a.totalMaintenanceCost), 0);
  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span style={{ color: "var(--text-secondary)" }}>{t("assets")}</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("assets")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{assets.length} asset terdaftar</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" /> {t("add_asset")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: t("total_assets"), value: assets.length.toString(), icon: Boxes, color: "#7c3aed", glow: "rgba(124,58,237,0.2)" },
          { label: t("purchase_price"), value: fmt(totalValue), icon: TrendingUp, color: "#10b981", glow: "rgba(16,185,129,0.2)" },
          { label: t("total_maintenance_cost"), value: fmt(totalMaintCost), icon: TrendingUp, color: "#f59e0b", glow: "rgba(245,158,11,0.2)" },
        ].map((card, i) => (
          <div key={i} className="stat-card group">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${card.glow}, transparent 60%)` }} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20">
            <Boxes className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("no_data")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>{t("asset_name")}</th><th>{t("category")}</th>
                  <th className="text-right">{t("purchase_price")}</th>
                  <th className="text-right">{t("total_maintenance_cost")}</th>
                  <th>{t("purchase_date")}</th><th>{t("warranty_end_date")}</th>
                  <th className="text-center">—</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => {
                  const colors = CATEGORY_COLORS[asset.category] ?? CATEGORY_COLORS.PROPERTY;
                  return (
                    <tr key={asset.id}>
                      <td><span className="font-semibold" style={{ color: "var(--text-primary)" }}>{asset.assetName}</span></td>
                      <td>
                        <span className="badge" style={{ background: colors.bg, color: colors.text }}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: colors.dot }} />
                          {categoryLabel[asset.category]}
                        </span>
                      </td>
                      <td className="text-right font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(Number(asset.purchasePrice))}</td>
                      <td className="text-right font-mono text-sm" style={{ color: Number(asset.totalMaintenanceCost) > 0 ? "#f59e0b" : "var(--text-muted)" }}>{fmt(Number(asset.totalMaintenanceCost))}</td>
                      <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{asset.purchaseDate?.split("T")[0]}</td>
                      <td className="text-sm" style={{ color: "var(--text-muted)" }}>{asset.warrantyEndDate?.split("T")[0] ?? "—"}</td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(asset)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-violet-500/10" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(asset.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-400" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{editingId ? t("edit") : t("create")} Asset</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{editingId ? "Update detail aset" : "Tambah aset baru ke portofolio"}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-ghost w-8 h-8 p-0 justify-center"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("asset_name")}</label>
                  <input value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} required className="input-glass" placeholder="Nama aset..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("category")}</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-glass">
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("purchase_price")}</label>
                  <input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} required className="input-glass" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("purchase_date")}</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required className="input-glass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("warranty_end_date")}</label>
                  <input type="date" value={form.warrantyEndDate} onChange={e => setForm({ ...form, warrantyEndDate: e.target.value })} className="input-glass" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("taxation_deadline")}</label>
                  <input type="date" value={form.taxationDeadline} onChange={e => setForm({ ...form, taxationDeadline: e.target.value })} className="input-glass" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center py-2.5">{t("save")}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center py-2.5">{t("cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
