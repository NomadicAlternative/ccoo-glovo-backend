/**
 * Script to create a development admin user.
 * Usage: JWT_SECRET should be set in .env or environment. Run:
 * node scripts/seed-admin.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.DEV_ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.DEV_ADMIN_PASS || 'AdminPass2026!';

  const existing = await prisma.users.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin already exists:', adminEmail);
    process.exit(0);
  }

  const hash = await bcrypt.hash(adminPass, 10);
  const user = await prisma.users.create({ data: { email: adminEmail, passwordHash: hash, role: 'ADMIN' } });
  console.log('Created admin user:', user.email);
  console.log('Password (dev):', adminPass);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
