"use client";
import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/i18nContext";
import { PlusCircle } from "lucide-react";

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

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_APPROVAL: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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
    ASSIGNED: t("status_assigned"),
    IN_PROGRESS: t("status_in_progress"),
    WAITING_APPROVAL: t("status_waiting_approval"),
    COMPLETED: t("status_completed"),
    REJECTED: t("status_rejected"),
  };

  async function fetchAll() {
    setLoading(true);
    const [tasksRes, assetsRes, staffRes] = await Promise.all([
      fetch("/api/maintenance"),
      fetch("/api/assets"),
      fetch("/api/staff"),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (assetsRes.ok) setAssets(await assetsRes.json());
    if (staffRes.ok) setStaffList(await staffRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ assetId: "", staffId: "", taskDescription: "", dueDate: "" }); fetchAll(); }
  }

  async function handleStatusChange(taskId: string, status: string) {
    await fetch(`/api/maintenance/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("maintenance")}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">
          <PlusCircle className="w-4 h-4" /> {t("assign_task")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("assign_task")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("assets")}</label>
              <select value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">-- {t("assets")} --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.assetName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("staff_member")}</label>
              <select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">-- {t("staff_member")} --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("task_description")}</label>
              <textarea value={form.taskDescription} onChange={e => setForm({ ...form, taskDescription: e.target.value })} required rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("due_date")}</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
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
      ) : tasks.length === 0 ? (
        <p className="text-gray-400 text-center py-12">{t("no_data")}</p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>{statusLabel[task.status]}</span>
                    <span className="text-xs text-gray-400">{t("due_date")}: {task.dueDate?.split("T")[0]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{task.taskDescription}</p>
                  {task.vendorName && <p className="text-xs text-gray-500 mt-1">{t("vendor_name")}: {task.vendorName}</p>}
                  {task.proofImageUrl && <a href={task.proofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">{t("proof_image")}</a>}
                </div>
                <div className="text-right">
                  {task.submittedCost && Number(task.submittedCost) > 0 && (
                    <p className="text-sm font-mono">Rp {Number(task.submittedCost).toLocaleString("id-ID")}</p>
                  )}
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                    className="mt-1 text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {["ASSIGNED", "IN_PROGRESS", "WAITING_APPROVAL", "COMPLETED", "REJECTED"].map(s => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
