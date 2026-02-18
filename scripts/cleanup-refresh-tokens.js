#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    const now = new Date();
    // Delete tokens that are expired
    const expired = await prisma.refresh_tokens.deleteMany({ where: { expiresAt: { lt: now } } });
    // Optionally, remove revoked tokens older than 30 days
    const olderThan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const revoked = await prisma.refresh_tokens.deleteMany({ where: { revoked: true, updatedAt: { lt: olderThan } } }).catch(() => ({ count: 0 }));

    console.log(`Cleanup complete. Expired removed: ${expired.count}. Revoked (old) removed: ${revoked.count || 0}`);
  } catch (err) {
    console.error('Cleanup failed', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
