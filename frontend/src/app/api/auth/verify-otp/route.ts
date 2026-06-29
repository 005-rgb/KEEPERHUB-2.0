import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { otpStore } from "../login/route";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otpCode } = await req.json();
    if (!phoneNumber || !otpCode) return NextResponse.json({ error: "Phone number and OTP required" }, { status: 400 });

    const storedOtp = otpStore.get(phoneNumber);
    if (!storedOtp || storedOtp !== otpCode) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { phoneNumber, role: "OWNER" },
      include: { tenant: true },
    });
    if (!user) return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    if (!user.tenant.isActive) return NextResponse.json({ error: "Tenant account is inactive" }, { status: 403 });

    otpStore.delete(phoneNumber);

    const token = await signToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role as "OWNER" | "STAFF",
      preferredLanguage: user.preferredLanguage as "ID" | "EN",
    });

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
    });

    response.cookies.set("kh_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
