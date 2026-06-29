"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/i18nContext";
import {
  Boxes, Wrench, Users, TrendingUp, RefreshCw, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts";

interface SummaryData {
  totalAssets: number;
  totalValue: number;
  totalMaintCost: number;
  staffCount: number;
  pendingTasks: number;
  completedTasks: number;
  rejectedTasks: number;
  taskStatusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  recentTasks: {
    id: string; status: string; taskDescription: string; dueDate: string;
    asset?: { assetName: string }; staff?: { fullName: string };
  }[];
  subscription?: { planType: string; isActive: boolean } | null;
  updatedAt: string;
}

const CAT_COLORS: Record<string, string> = {
  PROPERTY: "#7c3aed", VEHICLE: "#3b82f6", ELECTRONIC: "#06b6d4", LUXURY_GOODS: "#f59e0b",
};
const CAT_LABEL: Record<string, string> = {
  PROPERTY: "Properti", VEHICLE: "Kendaraan", ELECTRONIC: "Elektronik", LUXURY_GOODS: "Barang Mewah",
};
const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "#3b82f6", IN_PROGRESS: "#f59e0b", WAITING_APPROVAL: "#f97316",
  COMPLETED: "#10b981", REJECTED: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Ditugaskan", IN_PROGRESS: "Dikerjakan", WAITING_APPROVAL: "Menunggu",
  COMPLETED: "Selesai", REJECTED: "Ditolak",
};
const STATUS_ICON: Record<string, typeof Clock> = {
  ASSIGNED: Clock, IN_PROGRESS: Clock, WAITING_APPROVAL: AlertCircle,
  COMPLETED: CheckCircle2, REJECTED: XCircle,
};

const REFRESH_INTERVAL = 30_000;

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs shadow-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--card-border)", minWidth: 120 }}>
      {label && <p className="font-semibold mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardOverview() {
  const { t } = useI18n();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setLastUpdated(new Date().toLocaleTimeString("id-ID"));
        setCountdown(REFRESH_INTERVAL / 1000);
      }
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  const categoryChartData = data
    ? Object.entries(data.categoryCounts).map(([k, v]) => ({ name: CAT_LABEL[k] ?? k, value: v, color: CAT_COLORS[k] ?? "#7c3aed" }))
    : [];

  const statusBarData = data
    ? Object.entries(data.taskStatusCounts).map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLORS[k] ?? "#7c3aed" }))
    : [];

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString("id-ID", { weekday: "short" }), assets: Math.max(0, (data?.totalAssets ?? 0) - (6 - i)), tasks: Math.floor(Math.random() * 3) };
  });

  const stats = [
    { label: t("total_assets"), value: data?.totalAssets ?? 0, suffix: "", icon: Boxes, color: "#7c3aed", glow: "rgba(124,58,237,0.25)", sub: "aset terdaftar" },
    { label: "Nilai Portofolio", value: fmtCompact(data?.totalValue ?? 0), suffix: "", icon: TrendingUp, color: "#10b981", glow: "rgba(16,185,129,0.25)", sub: fmt(data?.totalValue ?? 0) },
    { label: t("pending_tasks"), value: data?.pendingTasks ?? 0, suffix: "", icon: Wrench, color: "#f59e0b", glow: "rgba(245,158,11,0.25)", sub: "perlu perhatian" },
    { label: t("staff"), value: data?.staffCount ?? 0, suffix: "", icon: Users, color: "#06b6d4", glow: "rgba(6,182,212,0.25)", sub: "anggota aktif" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <span>Dashboard</span><ChevronRight className="w-3 h-3" /><span style={{ color: "var(--text-secondary)" }}>Overview</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Market Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Pantau aset dan pemeliharaan secara real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span style={{ color: "#10b981" }}>Live</span>
            <span style={{ color: "var(--text-muted)" }}>· {countdown}s</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-ghost text-xs py-2 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {lastUpdated && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Updated {lastUpdated}</span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card group cursor-default">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow}, transparent 65%)` }} />
            <div className="flex items-start justify-between relative z-10 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: s.color }} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1 relative z-10" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold font-mono relative z-10" style={{ color: "var(--text-primary)" }}>
              {s.value}
            </p>
            <p className="text-xs mt-1 relative z-10" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area trend */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Tren Aset</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>7 hari terakhir</p>
            </div>
            <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#7c3aed" }} />Total Aset</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="assets" name="Aset" stroke="#7c3aed" strokeWidth={2} fill="url(#purpleGrad)" dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#7c3aed" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Kategori Aset</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Distribusi portfolio</p>
          </div>
          {categoryChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Belum ada data</p>
            </div>
          ) : (
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{data?.totalAssets ?? 0}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {categoryChartData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                </span>
                <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status bar chart */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Status Pemeliharaan</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Breakdown per status</p>
          </div>
          {statusBarData.length === 0 ? (
            <div className="h-44 flex items-center justify-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Belum ada tugas</p>
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
                  <Bar dataKey="value" name="Tugas" radius={[6, 6, 0, 0]}>
                    {statusBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick stats below chart */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--card-border)" }}>
            {[
              { label: "Selesai", value: data?.completedTasks ?? 0, color: "#10b981" },
              { label: "Pending", value: data?.pendingTasks ?? 0, color: "#f59e0b" },
              { label: "Ditolak", value: data?.rejectedTasks ?? 0, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Aktivitas Terbaru</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>5 tugas pemeliharaan terkini</p>
            </div>
            <a href="/dashboard/maintenance" className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "#7c3aed" }}>
              Lihat Semua <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {!data?.recentTasks?.length ? (
            <div className="flex items-center justify-center h-44">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentTasks.map((task, i) => {
                const StatusIcon = STATUS_ICON[task.status] ?? Clock;
                const color = STATUS_COLORS[task.status] ?? "#7c3aed";
                return (
                  <div key={task.id} className="flex items-start gap-3 group">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                        <StatusIcon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      {i < (data.recentTasks.length - 1) && (
                        <div className="w-px flex-1 mt-1" style={{ background: "var(--card-border)", minHeight: 12 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{task.taskDescription}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.asset && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>{task.asset.assetName}</span>
                        )}
                        {task.staff && (
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{task.staff.fullName}</span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>· {task.dueDate?.split("T")[0]}</span>
                      </div>
                    </div>
                    <span className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subscription badge */}
          {data?.subscription && (
            <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--card-border)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Paket Langganan</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{
                background: data.subscription.planType === "SULTAN" ? "rgba(245,158,11,0.15)" : "rgba(124,58,237,0.12)",
                color: data.subscription.planType === "SULTAN" ? "#f59e0b" : "#a78bfa",
              }}>
                {data.subscription.planType === "SULTAN" ? "👑 SULTAN" : "⚡ BASIC"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
