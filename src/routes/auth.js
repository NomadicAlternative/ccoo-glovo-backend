const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { normalizeExpiresIn, parseDurationToDate } = require('../utils/jwtExpiry');
const crypto = require('crypto');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });

    const expiresCfg = process.env.JWT_EXPIRES_IN;
    const normalized = normalizeExpiresIn(expiresCfg);
    let accessToken;
    if (normalized === null) {
      // 'never' case: do not pass expiresIn option
      accessToken = jwt.sign({ sub: user.id, role: user.role }, secret);
    } else {
      accessToken = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: normalized });
    }

    // create refresh token (opaque) and store hashed with a tokenId for efficient lookup
    const tokenId = crypto.randomBytes(16).toString('hex');
    const refreshSecret = crypto.randomBytes(48).toString('hex');
    const refreshTokenValue = refreshSecret; // opaque part
    const refreshToken = `${tokenId}.${refreshTokenValue}`;
    const refreshHash = await bcrypt.hash(refreshTokenValue, 10);

    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    const expiresAt = parseDurationToDate(refreshExpires);

    await prisma.refresh_tokens.create({ data: { tokenId, tokenHash: refreshHash, userId: user.id, expiresAt } });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh endpoint: exchange refresh token for new access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    // Expecting format tokenId.tokenValue
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid refresh token format' });
    const [tokenId, tokenValue] = parts;

    const stored = await prisma.refresh_tokens.findUnique({ where: { tokenId } });
    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });
    if (stored.revoked) return res.status(401).json({ error: 'Refresh token revoked' });
    if (stored.expiresAt && new Date(stored.expiresAt) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    const match = await bcrypt.compare(tokenValue, stored.tokenHash);
    if (!match) return res.status(401).json({ error: 'Invalid refresh token' });

    const user = await prisma.users.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ error: 'Invalid token user' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });

  // Rotate: revoke old token and issue a new refresh token
  await prisma.refresh_tokens.update({ where: { id: stored.id }, data: { revoked: true } });

    const newTokenId = crypto.randomBytes(16).toString('hex');
    const newSecret = crypto.randomBytes(48).toString('hex');
    const newTokenValue = newSecret;
    const newRefreshToken = `${newTokenId}.${newTokenValue}`;
    const newHash = await bcrypt.hash(newTokenValue, 10);
    let newExpiresAt = null;
    const refreshExpiresCfg = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    if (refreshExpiresCfg.endsWith('d')) {
      const days = parseInt(refreshExpiresCfg.slice(0, -1), 10);
      if (!isNaN(days)) newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    await prisma.refresh_tokens.create({ data: { tokenId: newTokenId, tokenHash: newHash, userId: user.id, expiresAt: newExpiresAt } });

    const newExpiresCfg = process.env.JWT_EXPIRES_IN;
    const newNormalized = normalizeExpiresIn(newExpiresCfg);
    let accessToken;
    if (newNormalized === null) {
      accessToken = jwt.sign({ sub: user.id, role: user.role }, secret);
    } else {
      accessToken = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: newNormalized });
    }
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout: revoke refresh token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid refresh token format' });
    const [tokenId, tokenValue] = parts;
    const stored = await prisma.refresh_tokens.findUnique({ where: { tokenId } });
    if (!stored) return res.status(400).json({ error: 'Token not found' });
    const match = await bcrypt.compare(tokenValue, stored.tokenHash);
    if (!match) return res.status(400).json({ error: 'Token not found' });
    await prisma.refresh_tokens.update({ where: { id: stored.id }, data: { revoked: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
