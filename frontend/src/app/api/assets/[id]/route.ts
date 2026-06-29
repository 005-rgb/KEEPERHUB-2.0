import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireOwner } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireOwner(session);
    const body = await req.json();

    const asset = await prisma.asset.findFirst({ where: { id: params.id, tenantId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const updated = await prisma.asset.update({
      where: { id: params.id },
      data: {
        assetName: body.assetName,
        category: body.category,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
        taxationDeadline: body.taxationDeadline ? new Date(body.taxationDeadline) : null,
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await extractTenantFromRequest(req);
    const { tenantId } = requireOwner(session);

    const asset = await prisma.asset.findFirst({ where: { id: params.id, tenantId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    await prisma.asset.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
