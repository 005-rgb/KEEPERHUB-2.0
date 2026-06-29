import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner, requireAuth } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireAuth(session);

    const tasks = await prisma.maintenanceTask.findMany({
      where: { tenantId },
      orderBy: { dueDate: "asc" },
      include: {
        asset: { select: { assetName: true } },
        staff: { select: { fullName: true } },
      },
    });
    return NextResponse.json(tasks);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireOwner(session);
    const body = await req.json();

    const asset = await prisma.asset.findFirst({ where: { id: body.assetId, tenantId } });
    if (!asset) return NextResponse.json({ error: "Asset not found in tenant" }, { status: 404 });

    const task = await prisma.maintenanceTask.create({
      data: {
        tenantId,
        assetId: body.assetId,
        staffId: body.staffId,
        taskDescription: body.taskDescription,
        dueDate: new Date(body.dueDate),
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
