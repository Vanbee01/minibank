import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
export const runtime = "nodejs";
const schema = z.object({ email: z.string().email().max(160), password: z.string().min(1).max(200) });
export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !user.active || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch { return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 }); }
}