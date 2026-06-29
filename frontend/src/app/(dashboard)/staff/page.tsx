"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { PlusCircle, Trash2, Link } from "lucide-react";

interface StaffMember {
  id: string;
  fullName: string;
  phoneNumber: string;
  preferredLanguage: string;
}

export default function StaffPage() {
  const { t } = useI18n();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", preferredLanguage: "ID" });

  async function fetchStaff() {
    setLoading(true);
    const res = await fetch("/api/staff");
    if (res.ok) setStaff(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ fullName: "", phoneNumber: "", preferredLanguage: "ID" }); fetchStaff(); }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    fetchStaff();
  }

  async function handleMagicLink(staffId: string) {
    const res = await fetch("/api/staff/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId }),
    });
    if (res.ok) {
      const data = await res.json();
      setMagicLink(`${window.location.origin}/upload?token=${data.magicLinkToken}`);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("staff")}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">
          <PlusCircle className="w-4 h-4" /> {t("add_staff")}
        </button>
      </div>

      {magicLink && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-medium text-green-800 mb-1">{t("magic_link")}:</p>
          <code className="text-xs break-all text-green-700">{magicLink}</code>
          <button onClick={() => { navigator.clipboard.writeText(magicLink); setMagicLink(null); }} className="mt-2 text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Copy & Close</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("add_staff")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("full_name")}</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("phone_number")}</label>
              <input type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+628..." required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("preferred_language")}</label>
              <select value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                <option value="ID">🇮🇩 Bahasa Indonesia</option>
                <option value="EN">🇺🇸 English</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium">{t("save")}</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-center py-12">{t("loading")}</p>
      ) : staff.length === 0 ? (
        <p className="text-gray-400 text-center py-12">{t("no_data")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("full_name")}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("phone_number")}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("preferred_language")}</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{s.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{s.preferredLanguage === "ID" ? "🇮🇩 ID" : "🇺🇸 EN"}</span>
                  </td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => handleMagicLink(s.id)} title={t("generate_magic_link")} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"><Link className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
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
