import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "keeperhub-super-secret-key-change-in-production"
);
const ALG = "HS256";

export interface TokenPayload {
  sub: string;
  tenantId: string;
  role: "OWNER" | "STAFF";
  preferredLanguage: "ID" | "EN";
  exp?: number;
}

export async function signToken(payload: Omit<TokenPayload, "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("kh_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
