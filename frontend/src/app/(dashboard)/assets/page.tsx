"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

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

export default function AssetsPage() {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetName: "",
    category: "PROPERTY",
    purchaseDate: "",
    purchasePrice: "",
    warrantyEndDate: "",
    taxationDeadline: "",
  });

  const categoryLabel: Record<string, string> = {
    PROPERTY: t("category_property"),
    VEHICLE: t("category_vehicle"),
    ELECTRONIC: t("category_electronic"),
    LUXURY_GOODS: t("category_luxury_goods"),
  };

  async function fetchAssets() {
    setLoading(true);
    const res = await fetch("/api/assets");
    if (res.ok) {
      const data = await res.json();
      setAssets(data);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAssets(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/assets/${editingId}` : "/api/assets";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ assetName: "", category: "PROPERTY", purchaseDate: "", purchasePrice: "", warrantyEndDate: "", taxationDeadline: "" });
      fetchAssets();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    fetchAssets();
  }

  function handleEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      assetName: asset.assetName,
      category: asset.category,
      purchaseDate: asset.purchaseDate?.split("T")[0] ?? "",
      purchasePrice: asset.purchasePrice,
      warrantyEndDate: asset.warrantyEndDate?.split("T")[0] ?? "",
      taxationDeadline: asset.taxationDeadline?.split("T")[0] ?? "",
    });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("assets")}</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          <PlusCircle className="w-4 h-4" /> {t("add_asset")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editingId ? t("edit") : t("create")} {t("assets")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("asset_name")}</label>
                <input value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("purchase_price")}</label>
                <input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("purchase_date")}</label>
                <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("warranty_end_date")}</label>
                <input type="date" value={form.warrantyEndDate} onChange={e => setForm({ ...form, warrantyEndDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("taxation_deadline")}</label>
                <input type="date" value={form.taxationDeadline} onChange={e => setForm({ ...form, taxationDeadline: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium">{t("save")}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-center py-12">{t("loading")}</p>
      ) : assets.length === 0 ? (
        <p className="text-gray-400 text-center py-12">{t("no_data")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("asset_name")}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("category")}</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("purchase_price")}</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("total_maintenance_cost")}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("purchase_date")}</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{asset.assetName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">{categoryLabel[asset.category]}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">Rp {Number(asset.purchasePrice).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right font-mono">Rp {Number(asset.totalMaintenanceCost).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-gray-500">{asset.purchaseDate?.split("T")[0]}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => handleEdit(asset)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded transition"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
