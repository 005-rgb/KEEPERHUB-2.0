import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner, requireAuth } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireAuth(session);

    const staff = await prisma.user.findMany({
      where: { tenantId, role: "STAFF" },
      select: { id: true, fullName: true, phoneNumber: true, preferredLanguage: true },
    });
    return NextResponse.json(staff);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId, sub: ownerId } = requireOwner(session);
    const body = await req.json();

    const existing = await prisma.user.findFirst({ where: { phoneNumber: body.phoneNumber, tenantId } });
    if (existing) return NextResponse.json({ error: "Staff with this phone already exists" }, { status: 409 });

    const staff = await prisma.user.create({
      data: {
        tenantId,
        role: "STAFF",
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        ownerId,
        preferredLanguage: body.preferredLanguage ?? "ID",
      },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
