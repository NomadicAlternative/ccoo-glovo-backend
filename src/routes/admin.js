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

    const tokens = await prisma.refresh_tokens.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' }, 
      take: 200,
      include: { user: { select: { email: true, name: true } } }
    });

    // Return info including user email and name for display
    const safe = tokens.map(t => ({ 
      id: t.id, 
      tokenId: t.tokenId, 
      userId: t.userId, 
      userEmail: t.user?.email || 'Usuario desconocido',
      userName: t.user?.name || null,
      revoked: t.revoked, 
      expiresAt: t.expiresAt, 
      createdAt: t.createdAt 
    }));
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

// GET /api/admin/users - List all users
router.get('/users', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { refreshTokens: true }
        }
      }
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Prevent deletion of ADMIN users
    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'No se puede eliminar un usuario administrador' });
    }

    // Delete associated refresh tokens first
    await prisma.refresh_tokens.deleteMany({ where: { userId: id } });
    
    // Delete associated audit logs
    await prisma.token_audit_logs.deleteMany({ where: { adminUserId: id } });

    // Delete the user
    await prisma.users.delete({ where: { id } });

    res.json({ ok: true, message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all registered workers (trabajadores with accounts)
router.get('/workers', authMiddleware, requireRole(['ADMIN', 'LECTOR']), async (req, res) => {
  try {
    const workers = await prisma.worker_accounts.findMany({
      include: {
        trabajador: {
          include: {
            casos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const workersData = workers.map(w => ({
      id: w.id,
      email: w.email,
      nombre: w.trabajador?.nombre || 'Sin nombre',
      telefono: w.trabajador?.telefono || 'N/A',
      createdAt: w.createdAt,
      casosCount: w.trabajador?.casos?.length || 0
    }));

    res.json(workersData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a worker account and all related data
router.delete('/workers/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const worker = await prisma.worker_accounts.findUnique({ 
      where: { id },
      include: { trabajador: true }
    });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const trabajadorId = worker.trabajadorId;

    // Delete in correct order to avoid foreign key constraints
    // 1. Delete attachments for all cases of this worker
    if (trabajadorId) {
      const casos = await prisma.casos.findMany({ where: { trabajador_id: trabajadorId } });
      const casoIds = casos.map(c => c.id);
      
      if (casoIds.length > 0) {
        await prisma.attachments.deleteMany({ where: { caso_id: { in: casoIds } } });
      }
      
      // 2. Delete all cases of this worker
      await prisma.casos.deleteMany({ where: { trabajador_id: trabajadorId } });
    }

    // 3. Delete the worker account
    await prisma.worker_accounts.delete({ where: { id } });

    // 4. Delete the trabajador record
    if (trabajadorId) {
      await prisma.trabajadores.delete({ where: { id: trabajadorId } });
    }

    res.json({ ok: true, message: 'Usuario y todos sus datos eliminados correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
