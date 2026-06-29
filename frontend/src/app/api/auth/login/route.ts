import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const otpStore = new Map<string, string>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { phoneNumber, role: "OWNER" },
    });
    if (!user) return NextResponse.json({ error: "Owner not found with this phone number" }, { status: 404 });

    const otp = generateOtp();
    otpStore.set(phoneNumber, otp);

    console.log(`[KeeperHub OTP] Phone: ${phoneNumber} | OTP: ${otp}`);

    return NextResponse.json({ message: "OTP sent (mock)", devOtp: otp });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export { otpStore };
