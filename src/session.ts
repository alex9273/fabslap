import type { Env } from "./types";
import { getSessionUser } from "./db";

const SESSION_COOKIE = "session";
const ADMIN_COOKIE = "admin_session";
// Browsers cap persistent cookies at 400 days; that's as close to "never expires" as a cookie can get.
const MAX_COOKIE_AGE = 400 * 24 * 60 * 60;

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("Cookie");
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_COOKIE_AGE}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function currentUser(request: Request, env: Env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const user = await getSessionUser(env.DB, token);
  return user ?? null;
}

export function currentSessionToken(request: Request): string | null {
  return parseCookies(request)[SESSION_COOKIE] ?? null;
}

// Admin has no account/table: the cookie is a bearer token derived from the
// shared admin password via HMAC, so it can't be forged without that password
// and needs no server-side session storage. It never expires (per product
// decision), same as user sessions.
async function adminKey(env: Env): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey("raw", encoder.encode(env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function makeAdminToken(env: Env): Promise<string> {
  const key = await adminKey(env);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("admin"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function adminCookieHeader(token: string): string {
  return `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/admin; Max-Age=${MAX_COOKIE_AGE}`;
}

export function clearAdminCookieHeader(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/admin; Max-Age=0`;
}

export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const cookies = parseCookies(request);
  const token = cookies[ADMIN_COOKIE];
  if (!token) return false;
  const expected = await makeAdminToken(env);
  return timingSafeEqual(token, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
