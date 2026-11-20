import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" | "MEMBER" };
export async function createSession(user: SessionUser) {
  if (key.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key);
  (await cookies()).set("minibank_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("minibank_session")?.value;
  if (!token || key.length < 32) return null;
  try { const { payload } = await jwtVerify(token, key); return payload as unknown as SessionUser; } catch { return null; }
}
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}