import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner, requireAuth } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireAuth(session);

    const assets = await prisma.asset.findMany({
      where: { tenantId },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(assets);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId, sub: ownerId } = requireOwner(session);
    const body = await req.json();

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        ownerId,
        assetName: body.assetName,
        category: body.category,
        purchaseDate: new Date(body.purchaseDate),
        purchasePrice: body.purchasePrice,
        warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
        taxationDeadline: body.taxationDeadline ? new Date(body.taxationDeadline) : null,
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : msg.includes("required") ? 403 : 500 });
  }
}
