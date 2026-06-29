import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner } from "@/lib/tenant";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireOwner(session);

    const staff = await prisma.user.findFirst({ where: { id: params.id, tenantId, role: "STAFF" } });
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    await prisma.user.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
