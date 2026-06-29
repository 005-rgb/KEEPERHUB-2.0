const MAGIC_SECRET = process.env.MAGIC_LINK_SECRET ?? "keeperhub-magic-link-secret-32bytes";

function getKey(): CryptoKey | Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(MAGIC_SECRET.slice(0, 32).padEnd(32, "0"));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function createMagicLinkToken(staffId: string, tenantId: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify({ staffId, tenantId }));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return Buffer.from(combined).toString("base64url");
}

export async function decodeMagicLinkToken(token: string): Promise<{ staffId: string; tenantId: string } | null> {
  try {
    const key = await getKey();
    const combined = Buffer.from(token, "base64url");
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}
