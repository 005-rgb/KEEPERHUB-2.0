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

    // --- Tenant-Level Paywall ---
    const [subscription, assetCount] = await Promise.all([
      prisma.subscription.findFirst({ where: { tenantId } }),
      prisma.asset.count({ where: { tenantId } }),
    ]);

    if (subscription?.planType === "BASIC" && assetCount >= 3) {
      return NextResponse.json(
        {
          error: "PAYWALL",
          message: "Batas 3 Aset Tercapai. Silakan Upgrade ke Paket Sultan",
        },
        { status: 402 }
      );
    }

    // --- Field Validation ---
    if (!body.assetName || String(body.assetName).trim().length < 2) {
      return NextResponse.json({ error: "Nama aset minimal 2 karakter" }, { status: 422 });
    }
    const VALID_CATEGORIES = ["PROPERTY", "VEHICLE", "ELECTRONIC", "LUXURY_GOODS"];
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 422 });
    }
    const price = Number(body.purchasePrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Harga beli harus lebih dari 0" }, { status: 422 });
    }
    if (!body.purchaseDate) {
      return NextResponse.json({ error: "Tanggal pembelian wajib diisi" }, { status: 422 });
    }

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        ownerId,
        assetName: body.assetName.trim(),
        category: body.category,
        purchaseDate: new Date(body.purchaseDate),
        purchasePrice: price,
        warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
        taxationDeadline: body.taxationDeadline ? new Date(body.taxationDeadline) : null,
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : msg.includes("required") ? 403 : 500 }
    );
  }
}
