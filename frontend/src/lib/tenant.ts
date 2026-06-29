import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "./auth";

export async function extractTenantFromRequest(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("kh_token")?.value;

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;
  if (!token) return null;

  return verifyToken(token);
}

export function requireOwner(session: TokenPayload | null) {
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "OWNER") throw new Error("Owner access required");
  return session;
}

export function requireAuth(session: TokenPayload | null) {
  if (!session) throw new Error("Unauthorized");
  return session;
}
