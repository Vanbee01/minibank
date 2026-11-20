import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
export const runtime = "nodejs";
const amountSchema = z.string().regex(/^[1-9][0-9]{0,14}$/);
export async function GET() {
  try {
    const actor = await requireUser();
    const where = actor.role === "ADMIN" ? {} : { OR: [{ senderId: actor.id }, { recipientId: actor.id }] };
    const rows = await prisma.transaction.findMany({ where, include: { sender: { select: { name: true, email: true } }, recipient: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json(rows.map(t => ({ ...t, amount: t.amount.toString() })));
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}
export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    const input = z.object({ action: z.enum(["TRANSFER", "DEPOSIT", "WITHDRAW"]), amount: amountSchema, recipientQrToken: z.string().optional(), memberId: z.string().optional(), description: z.string().trim().max(160).optional() }).parse(await req.json());
    const amount = BigInt(input.amount);
    if (input.action !== "TRANSFER" && actor.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin yang dapat mengelola saldo" }, { status: 403 });
    const result = await prisma.$transaction(async tx => {
      if (input.action === "TRANSFER") {
        if (!input.recipientQrToken) throw new Error("QR penerima wajib diisi");
        const recipient = await tx.user.findUnique({ where: { qrToken: input.recipientQrToken } });
        if (!recipient || !recipient.active || recipient.id === actor.id) throw new Error("QR anggota tidak valid");
        const sender = await tx.user.findUniqueOrThrow({ where: { id: actor.id } });
        if (sender.balance < amount) throw new Error("Saldo tidak mencukupi");
        await tx.user.update({ where: { id: sender.id }, data: { balance: { decrement: amount } } });
        await tx.user.update({ where: { id: recipient.id }, data: { balance: { increment: amount } } });
        await tx.transaction.create({ data: { type: "TRANSFER_OUT", amount, senderId: sender.id, recipientId: recipient.id, createdById: actor.id, description: input.description ?? "Transfer anggota" } });
        await tx.transaction.create({ data: { type: "TRANSFER_IN", amount, senderId: sender.id, recipientId: recipient.id, createdById: actor.id, description: input.description ?? "Transfer anggota" } });
        return { message: "Transfer berhasil", recipient: recipient.name };
      }
      if (!input.memberId) throw new Error("Anggota wajib dipilih");
      const member = await tx.user.findUniqueOrThrow({ where: { id: input.memberId } });
      if (!member.active) throw new Error("Akun anggota nonaktif");
      if (input.action === "WITHDRAW") {
        const updated = await tx.user.updateMany({ where: { id: member.id, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
        if (!updated.count) throw new Error("Saldo anggota tidak mencukupi");
      } else await tx.user.update({ where: { id: member.id }, data: { balance: { increment: amount } } });
      await tx.transaction.create({ data: { type: input.action === "DEPOSIT" ? "DEPOSIT" : "WITHDRAW", amount, recipientId: member.id, createdById: actor.id, description: input.description ?? (input.action === "DEPOSIT" ? "Setoran saldo" : "Penarikan saldo") } });
      return { message: "Transaksi berhasil", member: member.name };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(result);
  } catch (e) { const msg = e instanceof Error ? e.message : "Transaksi gagal"; return NextResponse.json({ error: msg === "UNAUTHORIZED" ? "Unauthorized" : msg }, { status: msg === "UNAUTHORIZED" ? 401 : 400 }); }
}