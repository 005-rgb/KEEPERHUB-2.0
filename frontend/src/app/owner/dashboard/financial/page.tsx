import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Car, Cpu, Gem, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

const CAT_META: Record<string, { label_id: string; label_en: string; color: string; bg: string }> = {
  PROPERTY:     { label_id: "Properti",     label_en: "Property",     color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  VEHICLE:      { label_id: "Kendaraan",    label_en: "Vehicle",      color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  ELECTRONIC:   { label_id: "Elektronik",   label_en: "Electronic",   color: "#06b6d4", bg: "rgba(6,182,212,0.12)"  },
  LUXURY_GOODS: { label_id: "Barang Mewah", label_en: "Luxury Goods", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

function fmtIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function FinancialDetailPage() {
  // --- Auth & OWNER-only Guard ---
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/login");

  const { tenantId } = session;

  // --- Server-side Data Fetching ---
  // 1. All assets for this tenant
  const assets = await prisma.asset.findMany({
    where: { tenantId },
    orderBy: { purchaseDate: "desc" },
  });

  // 2. Aggregate total COMPLETED service cost per asset using _sum
  const maintenanceSums = await prisma.maintenanceTask.groupBy({
    by: ["assetId"],
    where: { tenantId, status: "COMPLETED" },
    _sum: { submittedCost: true },
  });

  // Build lookup map: assetId → total service cost
  const sumMap = new Map<string, number>(
    maintenanceSums.map(s => [s.assetId, Number(s._sum.submittedCost ?? 0)])
  );

  // 3. Compose financial rows
  const rows = assets.map(asset => {
    const purchasePrice = Number(asset.purchasePrice);
    const totalServiceCost = sumMap.get(asset.id) ?? 0;
    const totalExpenditure = purchasePrice + totalServiceCost;
    return { ...asset, purchasePrice, totalServiceCost, totalExpenditure };
  });

  // 4. Portfolio totals
  const grandPurchasePrice = rows.reduce((s, r) => s + r.purchasePrice, 0);
  const grandServiceCost = rows.reduce((s, r) => s + r.totalServiceCost, 0);
  const grandExpenditure = rows.reduce((s, r) => s + r.totalExpenditure, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Detail Finansial Aset
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Laporan pengeluaran real-time berdasarkan data database — hanya untuk OWNER
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Harga Beli Awal",
            value: fmtIDR(grandPurchasePrice),
            sub: `${assets.length} aset`,
            icon: Wallet,
            color: "#7c3aed",
            glow: "rgba(124,58,237,0.15)",
          },
          {
            label: "Total Biaya Servis (Selesai)",
            value: fmtIDR(grandServiceCost),
            sub: `${maintenanceSums.length} aset dengan servis`,
            icon: TrendingDown,
            color: "#ef4444",
            glow: "rgba(239,68,68,0.12)",
          },
          {
            label: "Total Pengeluaran Riil",
            value: fmtIDR(grandExpenditure),
            sub: "Harga Beli + Biaya Servis",
            icon: TrendingUp,
            color: "#f59e0b",
            glow: "rgba(245,158,11,0.15)",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 relative overflow-hidden group"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${card.glow}, transparent 65%)` }}
            />
            <div className="flex items-start justify-between relative z-10 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}18` }}
              >
                <card.icon className="w-4.5 h-4.5" style={{ color: card.color, width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider mb-1 relative z-10" style={{ color: "var(--text-muted)" }}>
              {card.label}
            </p>
            <p className="text-lg font-bold font-mono leading-tight relative z-10" style={{ color: "var(--text-primary)" }}>
              {card.value}
            </p>
            <p className="text-xs mt-1 relative z-10" style={{ color: "var(--text-muted)" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Financial Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        {/* Table Header Row */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--card-border)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Rincian Per Aset
          </h2>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
          >
            {rows.length} aset
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Belum ada aset terdaftar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {[
                    { label: "Nama Aset", align: "left" },
                    { label: "Kategori", align: "left" },
                    { label: "Tgl. Beli", align: "left" },
                    { label: "Harga Beli Awal", align: "right" },
                    { label: "Total Biaya Servis", align: "right" },
                    { label: "Total Pengeluaran Riil", align: "right" },
                  ].map((col, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 20px",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        borderBottom: "1px solid var(--card-border)",
                        background: "rgba(124,58,237,0.03)",
                        textAlign: col.align as "left" | "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const meta = CAT_META[row.category] ?? CAT_META.PROPERTY;
                  const isLast = idx === rows.length - 1;
                  const hasServiceCost = row.totalServiceCost > 0;
                  return (
                    <tr
                      key={row.id}
                      style={{
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Name */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          whiteSpace: "nowrap",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.assetName}
                      </td>
                      {/* Category */}
                      <td
                        style={{
                          padding: "16px 20px",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: meta.bg,
                            color: meta.color,
                          }}
                        >
                          <span
                            style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: meta.color, flexShrink: 0,
                              display: "inline-block",
                            }}
                          />
                          {meta.label_id}
                        </span>
                      </td>
                      {/* Purchase Date */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.purchaseDate
                          ? new Date(row.purchaseDate).toLocaleDateString("id-ID", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>
                      {/* Purchase Price */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: 13,
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtIDR(row.purchasePrice)}
                      </td>
                      {/* Total Service Cost */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: 13,
                          fontFamily: "monospace",
                          fontWeight: hasServiceCost ? 600 : 400,
                          color: hasServiceCost ? "#ef4444" : "var(--text-muted)",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {hasServiceCost ? `−${fmtIDR(row.totalServiceCost)}` : "—"}
                      </td>
                      {/* Total Real Expenditure */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: 13,
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#f59e0b",
                          borderBottom: isLast ? "none" : "1px solid var(--card-border)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtIDR(row.totalExpenditure)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Footer */}
              {rows.length > 1 && (
                <tfoot>
                  <tr style={{ background: "rgba(124,58,237,0.04)" }}>
                    <td
                      colSpan={3}
                      style={{
                        padding: "14px 20px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                        borderTop: "1px solid var(--card-border)",
                      }}
                    >
                      TOTAL PORTOFOLIO
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 13,
                        fontFamily: "monospace",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        borderTop: "1px solid var(--card-border)",
                        textAlign: "right",
                      }}
                    >
                      {fmtIDR(grandPurchasePrice)}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 13,
                        fontFamily: "monospace",
                        fontWeight: 800,
                        color: grandServiceCost > 0 ? "#ef4444" : "var(--text-muted)",
                        borderTop: "1px solid var(--card-border)",
                        textAlign: "right",
                      }}
                    >
                      {grandServiceCost > 0 ? `−${fmtIDR(grandServiceCost)}` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 14,
                        fontFamily: "monospace",
                        fontWeight: 800,
                        color: "#f59e0b",
                        borderTop: "1px solid var(--card-border)",
                        textAlign: "right",
                      }}
                    >
                      {fmtIDR(grandExpenditure)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Methodology note */}
      <div
        className="rounded-2xl px-5 py-4 flex gap-3 items-start"
        style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(6,182,212,0.12)" }}
        >
          <span style={{ fontSize: 14 }}>ℹ️</span>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "#06b6d4" }}>Metodologi Kalkulasi</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <strong>Total Biaya Servis</strong> dihitung menggunakan agregasi{" "}
            <code
              className="px-1 py-0.5 rounded text-[10px]"
              style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}
            >
              _sum(submittedCost)
            </code>{" "}
            dari Prisma ORM pada tabel{" "}
            <code
              className="px-1 py-0.5 rounded text-[10px]"
              style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}
            >
              MaintenanceTask
            </code>{" "}
            yang berstatus <strong>COMPLETED</strong>.{" "}
            <strong>Total Pengeluaran Riil</strong> = Harga Beli Awal + Total Biaya Servis. Data diambil langsung dari database setiap halaman dimuat.
          </p>
        </div>
      </div>
    </div>
  );
}
