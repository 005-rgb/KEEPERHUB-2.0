"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { Plus, Trash2, Link2, Users, X, ChevronRight, Copy, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
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
      method: "POST", headers: { "Content-Type": "application/json" },
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId }),
    });
    if (res.ok) {
      const data = await res.json();
      setMagicLink(`${window.location.origin}/upload?token=${data.magicLinkToken}`);
    }
  }

  async function handleCopy() {
    if (!magicLink) return;
    await navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => { setCopied(false); setMagicLink(null); }, 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <span>Dashboard</span><ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--text-secondary)" }}>{t("staff")}</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("staff")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{staff.length} anggota staf</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> {t("add_staff")}
        </button>
      </div>

      {/* Magic Link Alert */}
      {magicLink && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3"
          style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.15)" }}>
            <Link2 className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: "#10b981" }}>{t("magic_link")} — {t("generate_magic_link")}</p>
            <code className="text-xs break-all block" style={{ color: "var(--text-secondary)" }}>{magicLink}</code>
          </div>
          <button onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      )}

      {/* Staff Grid */}
      {loading ? (
        <div className="glass-card flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="glass-card text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("no_data")}</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-xs">
            <Plus className="w-3.5 h-3.5" /> {t("add_staff")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s, i) => {
            const colors = [
              { from: "#7c3aed", to: "#3b82f6" },
              { from: "#06b6d4", to: "#7c3aed" },
              { from: "#10b981", to: "#06b6d4" },
              { from: "#f59e0b", to: "#ef4444" },
            ][i % 4];
            return (
              <div key={s.id} className="glass-card p-5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${colors.from}, transparent)` }} />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}>
                    {s.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{s.fullName}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{s.phoneNumber}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>
                        {t("staff_member")}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.preferredLanguage === "ID" ? "🇮🇩" : "🇺🇸"} {s.preferredLanguage}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t relative z-10" style={{ borderColor: "var(--card-border)" }}>
                  <button onClick={() => handleMagicLink(s.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-semibold transition-all"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                    title={t("generate_magic_link")}>
                    <Link2 className="w-3.5 h-3.5" /> Link
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-semibold transition-all"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                    <Trash2 className="w-3.5 h-3.5" /> {t("delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t("add_staff")}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tambah anggota staf baru</p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-ghost w-8 h-8 p-0 justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("full_name")}</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required
                  className="input-glass" placeholder="Nama lengkap..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("phone_number")}</label>
                <input type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="+628..." required className="input-glass" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("preferred_language")}</label>
                <select value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })} className="input-glass">
                  <option value="ID">🇮🇩 Bahasa Indonesia</option>
                  <option value="EN">🇺🇸 English</option>
                </select>
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
