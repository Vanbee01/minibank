import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) are required");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Administrator", email, passwordHash, role: Role.ADMIN }
  });
}
main().finally(() => prisma.$disconnect());