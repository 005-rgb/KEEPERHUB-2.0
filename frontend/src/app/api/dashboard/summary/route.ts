import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireAuth } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireAuth(session);

    const [
      assets,
      tasks,
      staffCount,
      subscription,
      recentTasks,
    ] = await Promise.all([
      prisma.asset.findMany({ where: { tenantId } }),
      prisma.maintenanceTask.findMany({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, role: "STAFF" } }),
      prisma.subscription.findFirst({ where: { tenantId } }),
      prisma.maintenanceTask.findMany({
        where: { tenantId },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          asset: { select: { assetName: true } },
          staff: { select: { fullName: true } },
        },
      }),
    ]);

    const totalAssets = assets.length;
    const totalValue = assets.reduce((s, a) => s + Number(a.purchasePrice), 0);
    const totalMaintCost = assets.reduce((s, a) => s + Number(a.totalMaintenanceCost), 0);

    const taskStatusCounts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = assets.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingCount = (taskStatusCounts["ASSIGNED"] || 0) +
      (taskStatusCounts["IN_PROGRESS"] || 0) +
      (taskStatusCounts["WAITING_APPROVAL"] || 0);

    return NextResponse.json({
      totalAssets,
      totalValue,
      totalMaintCost,
      staffCount,
      pendingTasks: pendingCount,
      completedTasks: taskStatusCounts["COMPLETED"] || 0,
      rejectedTasks: taskStatusCounts["REJECTED"] || 0,
      taskStatusCounts,
      categoryCounts,
      recentTasks,
      subscription,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
