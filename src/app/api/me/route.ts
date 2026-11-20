import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { id: true, name: true, email: true, role: true, balance: true, qrToken: true, createdAt: true } });
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ...user, balance: user.balance.toString() });
}