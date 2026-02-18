const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Worker register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'name, email and password required' });

    // Find or create trabajador row
    let trabajador = await prisma.trabajadores.findFirst({ where: { email } });
    if (!trabajador) {
      trabajador = await prisma.trabajadores.create({ data: { nombre: name, email, telefono: phone } });
    }

    // Prevent duplicate worker accounts
    const exists = await prisma.worker_accounts.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const account = await prisma.worker_accounts.create({ data: { trabajadorId: trabajador.id, email, passwordHash } });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });
    const expiresIn = process.env.WORKER_JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ sub: account.id, role: 'WORKER', type: 'worker' }, secret, { expiresIn });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Worker login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const account = await prisma.worker_accounts.findUnique({ where: { email } });
    if (!account) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });
    const expiresIn = process.env.WORKER_JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ sub: account.id, role: 'WORKER', type: 'worker' }, secret, { expiresIn });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current worker (requires Bearer token issued to worker)
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    const token = auth.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET;
      const payload = jwt.verify(token, secret);
      if (payload.type !== 'worker') return res.status(403).json({ error: 'Not a worker token' });

      const account = await prisma.worker_accounts.findUnique({ where: { id: payload.sub }, include: { trabajador: true } });
      if (!account) return res.status(404).json({ error: 'Account not found' });

      res.json({ id: account.id, email: account.email, trabajador: account.trabajador });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
