import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner } from "@/lib/tenant";
import { createMagicLinkToken } from "@/lib/magic-link";

export async function POST(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireOwner(session);
    const { staffId } = await req.json();

    const staff = await prisma.user.findFirst({ where: { id: staffId, tenantId, role: "STAFF" } });
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const magicLinkToken = await createMagicLinkToken(staffId, tenantId);
    return NextResponse.json({ magicLinkToken, staffId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
