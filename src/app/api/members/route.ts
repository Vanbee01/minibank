import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
export const runtime = "nodejs";
export async function GET() {
  try {
    const actor = await requireUser();
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, balance: true, active: true, createdAt: true } });
    return NextResponse.json(users.map(u => ({ ...u, balance: u.balance.toString() })));
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    const input = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().max(160), password: z.string().min(10).max(100) }).parse(await req.json());
    const user = await prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12) }, select: { id: true, name: true, email: true, qrToken: true } });
    return NextResponse.json(user, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error && e.message === "UNAUTHORIZED" ? "Unauthorized" : "Gagal membuat anggota. Periksa email agar tidak duplikat." }, { status: 400 }); }
}