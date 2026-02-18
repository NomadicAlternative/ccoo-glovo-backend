const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/admin/refresh-tokens?status=expired|revoked|all
router.get('/refresh-tokens', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const now = new Date();
    let where = {};
    if (status === 'expired') {
      where = { expiresAt: { lt: now } };
    } else if (status === 'revoked') {
      where = { revoked: true };
    }

    const tokens = await prisma.refresh_tokens.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });

    // Return lightweight info for audit
    const safe = tokens.map(t => ({ id: t.id, tokenId: t.tokenId, userId: t.userId, revoked: t.revoked, expiresAt: t.expiresAt, createdAt: t.createdAt }));
    res.json({ tokens: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke a refresh token by token DB id
router.post('/refresh-tokens/:id/revoke', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const token = await prisma.refresh_tokens.findUnique({ where: { id } });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (token.revoked) return res.json({ ok: true, message: 'Already revoked' });

    await prisma.refresh_tokens.update({ where: { id }, data: { revoked: true } });

    // create audit log
    const note = req.body && req.body.note ? String(req.body.note).slice(0, 500) : null;
    await prisma.token_audit_logs.create({ data: { tokenId: token.tokenId, action: 'revoked', adminUserId: req.user.id, note } });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
