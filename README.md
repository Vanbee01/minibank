# MiniBank
Platform keuangan internal karyawan dengan saldo, tabungan, transfer QR, dan panel admin.

## Stack
Next.js 15 · TypeScript · PostgreSQL · Prisma · Tailwind CSS

## Environment
Set `DATABASE_URL`, `SESSION_SECRET` (minimal 32 karakter), `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` (minimal 12 karakter).

## Local setup
```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Railway
Build: `npm run build`
Pre-deploy: `npx prisma migrate deploy && npm run db:seed`
Start: `npm start`
Health check: `/`

Admin dapat membuat akun anggota. Semua nominal disimpan sebagai BigInt Rupiah; transfer dan perubahan saldo diproses dalam transaksi database serializable. Ini adalah aplikasi saldo internal, bukan bank berizin atau rekening simpanan bank.
