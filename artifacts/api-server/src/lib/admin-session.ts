import { createHmac, createHash, timingSafeEqual, randomUUID } from "node:crypto";
import type { Request } from "express";

export const ADMIN_COOKIE_NAME = "odhora_admin";
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function getAdminSecrets() {
  const password = process.env.ODHORA_ADMIN_PASSWORD;
  const signingSecret = process.env.SESSION_SECRET;
  if (!password || !signingSecret) return null;
  return { password, signingSecret };
}

export function passwordMatches(candidate: string, expected: string): boolean {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

function sign(payload: string, signingSecret: string): string {
  return createHmac("sha256", signingSecret).update(payload).digest("base64url");
}

export function createAdminSessionToken(signingSecret: string): string {
  const issuedAt = Date.now().toString();
  const nonce = randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload, signingSecret)}`;
}

export function isAdminRequest(req: Request): boolean {
  const config = getAdminSecrets();
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!config || typeof token !== "string") return false;

  const [issuedAt, nonce, signature, ...extra] = token.split(".");
  if (
    extra.length ||
    !issuedAt ||
    !/^\d{13}$/.test(issuedAt) ||
    !nonce ||
    !signature
  ) {
    return false;
  }

  const issuedAtMs = Number(issuedAt);
  const now = Date.now();
  if (
    !Number.isSafeInteger(issuedAtMs) ||
    issuedAtMs > now + 60_000 ||
    now - issuedAtMs > ADMIN_SESSION_TTL_MS
  ) {
    return false;
  }

  const payload = `${issuedAt}.${nonce}`;
  const expected = Buffer.from(sign(payload, config.signingSecret));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin",
    maxAge: ADMIN_SESSION_TTL_MS,
  };
}
