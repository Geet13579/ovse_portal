// Tiny signed-cookie session (works in both Node routes and the Edge middleware).
// Set AUTH_SECRET in .env.local for production.

export const COOKIE = "session";

const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
const enc = new TextEncoder();

function getKey() {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
  return out;
}

export async function createSession(email: string, remember: boolean) {
  const exp = Date.now() + (remember ? 7 * 24 : 12) * 60 * 60 * 1000;
  const payload = `${exp}|${email}`;
  const sig = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(payload));
  return `${btoa(payload)}.${toHex(sig)}`;
}

export async function verifySession(token?: string): Promise<boolean> {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;

  let payload: string;
  try {
    payload = atob(b64);
  } catch {
    return false;
  }

  const exp = Number(payload.split("|")[0]);
  if (!exp || exp < Date.now()) return false;

  return crypto.subtle.verify("HMAC", await getKey(), fromHex(sig), enc.encode(payload));
}
