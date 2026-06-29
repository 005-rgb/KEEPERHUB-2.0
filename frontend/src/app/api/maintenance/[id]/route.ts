import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireAuth } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireAuth(session);
    const body = await req.json();

    const task = await prisma.maintenanceTask.findFirst({ where: { id: params.id, tenantId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const wasCompleted = task.status === "COMPLETED";
    const updated = await prisma.maintenanceTask.update({
      where: { id: params.id },
      data: {
        status: body.status,
        submittedCost: body.submittedCost ?? undefined,
        proofImageUrl: body.proofImageUrl ?? undefined,
        vendorName: body.vendorName ?? undefined,
      },
    });

    if (body.status === "COMPLETED" && !wasCompleted && body.submittedCost) {
      await prisma.asset.update({
        where: { id: task.assetId },
        data: {
          totalMaintenanceCost: {
            increment: Number(body.submittedCost),
          },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
