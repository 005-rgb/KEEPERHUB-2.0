"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { Plus, Wrench, Clock, CheckCircle2, XCircle, X, ChevronRight, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  assetId: string;
  staffId: string;
  status: string;
  taskDescription: string;
  dueDate: string;
  submittedCost: string;
  proofImageUrl?: string;
  vendorName?: string;
  asset?: { assetName: string };
  staff?: { fullName: string };
}
interface Asset { id: string; assetName: string }
interface Staff { id: string; fullName: string }

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; icon: typeof Clock }> = {
  ASSIGNED:         { bg: "rgba(59,130,246,0.15)",  text: "#93c5fd", dot: "#3b82f6", icon: Clock },
  IN_PROGRESS:      { bg: "rgba(245,158,11,0.15)",  text: "#fcd34d", dot: "#f59e0b", icon: Clock },
  WAITING_APPROVAL: { bg: "rgba(249,115,22,0.15)",  text: "#fdba74", dot: "#f97316", icon: AlertCircle },
  COMPLETED:        { bg: "rgba(16,185,129,0.15)",  text: "#6ee7b7", dot: "#10b981", icon: CheckCircle2 },
  REJECTED:         { bg: "rgba(239,68,68,0.15)",   text: "#fca5a5", dot: "#ef4444", icon: XCircle },
};

export default function MaintenancePage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: "", staffId: "", taskDescription: "", dueDate: "" });

  const statusLabel: Record<string, string> = {
    ASSIGNED: t("status_assigned"), IN_PROGRESS: t("status_in_progress"),
    WAITING_APPROVAL: t("status_waiting_approval"), COMPLETED: t("status_completed"),
    REJECTED: t("status_rejected"),
  };

  async function fetchAll() {
    setLoading(true);
    const [tr, ar, sr] = await Promise.all([fetch("/api/maintenance"), fetch("/api/assets"), fetch("/api/staff")]);
    if (tr.ok) setTasks(await tr.json());
    if (ar.ok) setAssets(await ar.json());
    if (sr.ok) setStaffList(await sr.json());
    setLoading(false);
  }
  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/maintenance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ assetId: "", staffId: "", taskDescription: "", dueDate: "" }); fetchAll(); }
  }

  async function handleStatusChange(taskId: string, status: string) {
    await fetch(`/api/maintenance/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  }

  const counts = {
    total: tasks.length,
    pending: tasks.filter(t => ["ASSIGNED","IN_PROGRESS","WAITING_APPROVAL"].includes(t.status)).length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <span>Dashboard</span><ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--text-secondary)" }}>{t("maintenance")}</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("maintenance")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{counts.total} tugas total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> {t("assign_task")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t("total_assets"), value: counts.total, color: "#7c3aed", glow: "rgba(124,58,237,0.2)" },
          { label: t("pending_tasks"), value: counts.pending, color: "#f59e0b", glow: "rgba(245,158,11,0.2)" },
          { label: t("completed_tasks"), value: counts.completed, color: "#10b981", glow: "rgba(16,185,129,0.2)" },
        ].map((s, i) => (
          <div key={i} className="stat-card group">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow}, transparent 60%)` }} />
            <p className="text-xs uppercase tracking-wider mb-2 relative z-10" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-3xl font-bold font-mono relative z-10" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="glass-card flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card text-center py-20">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("no_data")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.ASSIGNED;
            const StatusIcon = s.icon;
            return (
              <div key={task.id} className="glass-card p-4 flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: s.bg }}>
                  <StatusIcon className="w-4 h-4" style={{ color: s.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge" style={{ background: s.bg, color: s.text }}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block flex-shrink-0" style={{ background: s.dot }} />
                      {statusLabel[task.status]}
                    </span>
                    {task.asset && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>
                        {task.asset.assetName}
                      </span>
                    )}
                    {task.staff && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        → {task.staff.fullName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{task.taskDescription}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {task.dueDate?.split("T")[0]}
                    </span>
                    {task.vendorName && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Vendor: {task.vendorName}</span>
                    )}
                    {task.proofImageUrl && (
                      <a href={task.proofImageUrl} target="_blank" rel="noreferrer"
                        className="text-xs underline" style={{ color: "#7c3aed" }}>Bukti</a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {Number(task.submittedCost) > 0 && (
                    <span className="text-xs font-mono font-semibold" style={{ color: "#f59e0b" }}>
                      {fmt(Number(task.submittedCost))}
                    </span>
                  )}
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                    className="text-xs rounded-lg px-2 py-1.5 outline-none border"
                    style={{
                      background: "var(--card)", borderColor: "var(--card-border)",
                      color: "var(--text-secondary)", fontSize: "11px",
                    }}
                  >
                    {Object.keys(STATUS_STYLE).map(st => (
                      <option key={st} value={st}>{statusLabel[st]}</option>
                    ))}
                  </select>
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
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t("assign_task")}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tugaskan pemeliharaan ke staf</p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-ghost w-8 h-8 p-0 justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("assets")}</label>
                <select value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })} required className="input-glass">
                  <option value="">-- Pilih Aset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.assetName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("staff_member")}</label>
                <select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} required className="input-glass">
                  <option value="">-- Pilih Staf --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("task_description")}</label>
                <textarea value={form.taskDescription} onChange={e => setForm({ ...form, taskDescription: e.target.value })} required rows={3}
                  className="input-glass resize-none" placeholder="Deskripsi tugas pemeliharaan..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{t("due_date")}</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="input-glass" />
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
