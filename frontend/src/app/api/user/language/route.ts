import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTenantFromRequest, requireAuth } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await extractTenantFromRequest(req);
    const { sub: userId } = requireAuth(session);

    const body = await req.json();
    const { language } = body;

    if (language !== "ID" && language !== "EN") {
      return NextResponse.json(
        { error: "Language harus ID atau EN" },
        { status: 422 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language },
    });

    return NextResponse.json({ ok: true, preferredLanguage: language });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 }
    );
  }
}
