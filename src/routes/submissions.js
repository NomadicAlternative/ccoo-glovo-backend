const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, requireRole } = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// Helper: map incoming category to DB enum
const categoryMap = {
  DESPIDO: 'despido',
  SANCION: 'sancion',
  VACACIONES: 'vacaciones',
  OTRO: 'otro',
  IMPAGO: 'impago'
};

// Validation and sanitization chain
const submissionValidators = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),
  body('email')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone max length is 20')
    .customSanitizer(v => v ? v.replace(/\D/g, '') : v),
  body('category')
    .trim()
    .customSanitizer(v => v ? v.toUpperCase() : v)
    .isIn(['DESPIDO', 'SANCION', 'VACACIONES', 'OTRO', 'IMPAGO']).withMessage('Invalid category'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Subject required (max 200)')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Message required (max 5000)')
    .escape()
];

// Create a submission (API uses English field names; we map to Spanish DB schema)
router.post('/', submissionValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, phone, company, category, subject, message } = req.body;

    const tipo_problema = categoryMap[category];

  // Find or create trabajador (email is not unique in existing schema, use findFirst)
  let trabajador = await prisma.trabajadores.findFirst({ where: { email } });
    if (!trabajador) {
      trabajador = await prisma.trabajadores.create({ data: { nombre: name, email, telefono: phone } });
    }

    const descripcion = `${subject} -- ${message}`;

    const caso = await prisma.casos.create({
      data: {
        trabajador_id: trabajador.id,
        tipo_problema,
        descripcion,
        estado: 'pendiente'
      }
    });

    // Generate a public access token for the worker to view the case later
    const tokenId = crypto.randomBytes(12).toString('hex');
    const tokenValue = crypto.randomBytes(24).toString('hex');
    const publicToken = `${tokenId}.${tokenValue}`;
    const tokenHash = await bcrypt.hash(tokenValue, 10);
    const expiresDays = parseInt(process.env.PUBLIC_TOKEN_EXPIRES_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await prisma.casos.update({ where: { id: caso.id }, data: { publicTokenId: tokenId, publicTokenHash: tokenHash, publicTokenExpires: expiresAt } });

    // Return the public token in the response (in production this should be emailed)
    res.status(201).json({ id: caso.id, createdAt: caso.fecha_creacion, publicToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public access: retrieve case by public token (no auth). Token format: tokenId.tokenValue
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const parts = token.split('.');
    if (parts.length !== 2) return res.status(400).json({ error: 'Invalid token format' });
    const [tokenId, tokenValue] = parts;

    const caso = await prisma.casos.findFirst({ where: { publicTokenId: tokenId } , include: { trabajadores: true, attachments: true }});
    if (!caso) return res.status(404).json({ error: 'Caso not found' });
    if (!caso.publicTokenHash) return res.status(400).json({ error: 'Public access not available' });
    if (caso.publicTokenExpires && new Date(caso.publicTokenExpires) < new Date()) return res.status(410).json({ error: 'Token expired' });

    const match = await bcrypt.compare(tokenValue, caso.publicTokenHash);
    if (!match) return res.status(401).json({ error: 'Invalid token' });

    // Return non-sensitive case data
    const safe = {
      id: caso.id,
      tipo_problema: caso.tipo_problema,
      descripcion: caso.descripcion,
      estado: caso.estado,
      fecha_creacion: caso.fecha_creacion,
      trabajador: {
        id: caso.trabajadores?.id,
        nombre: caso.trabajadores?.nombre,
        email: caso.trabajadores?.email
      },
      attachments: caso.attachments?.map(a => ({ id: a.id, filename: a.filename, url: a.url }))
    };
    res.json({ caso: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List cases (with pagination) - protected to REPRESENTANTE and ADMIN
router.get('/', authMiddleware, requireRole(['REPRESENTANTE', 'ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.category) where.tipo_problema = req.query.category.toLowerCase();

    const items = await prisma.casos.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha_creacion: 'desc' },
      include: { trabajadores: true }
    });

    const total = await prisma.casos.count({ where });

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single case by id - protected to REPRESENTANTE and ADMIN
router.get('/:id', authMiddleware, requireRole(['REPRESENTANTE', 'ADMIN']), async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10);
    if (isNaN(casoId)) return res.status(400).json({ error: 'Invalid caso id' });

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: { trabajadores: true, attachments: true }
    });
    if (!caso) return res.status(404).json({ error: 'Caso not found' });

    res.json({ caso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update case status - protected to REPRESENTANTE and ADMIN
router.patch('/:id', authMiddleware, requireRole(['REPRESENTANTE', 'ADMIN']), async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10);
    if (isNaN(casoId)) return res.status(400).json({ error: 'Invalid caso id' });

    const { estado } = req.body;
    // Match the casos_estado enum values in Prisma schema
    const validEstados = ['pendiente', 'en_revision', 'en_proceso', 'resuelto', 'cerrado'];
    if (!estado || !validEstados.includes(estado)) {
      return res.status(400).json({ error: 'Invalid estado. Valid values: pendiente, en_revision, en_proceso, resuelto, cerrado' });
    }

    const caso = await prisma.casos.findUnique({ where: { id: casoId } });
    if (!caso) return res.status(404).json({ error: 'Caso not found' });

    const updated = await prisma.casos.update({
      where: { id: casoId },
      data: { estado }
    });

    res.json({ caso: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a case and its attachments - protected to ADMIN only
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10);
    if (isNaN(casoId)) return res.status(400).json({ error: 'Invalid caso id' });

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: { attachments: true }
    });
    if (!caso) return res.status(404).json({ error: 'Caso not found' });

    // Delete attachment files from disk
    for (const att of caso.attachments) {
      const filePath = path.join(uploadDir, att.storedFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete attachments from DB
    await prisma.attachments.deleteMany({ where: { caso_id: casoId } });

    // Delete the case
    await prisma.casos.delete({ where: { id: casoId } });

    res.json({ message: 'Caso eliminado correctamente', deletedId: casoId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload an attachment for a given case (field name: file) - protected to REPRESENTANTE and ADMIN
router.post('/:id/attachments', authMiddleware, requireRole(['REPRESENTANTE', 'ADMIN']), upload.single('file'), async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10);
    if (isNaN(casoId)) return res.status(400).json({ error: 'Invalid caso id' });

    const caso = await prisma.casos.findUnique({ where: { id: casoId } });
    if (!caso) return res.status(404).json({ error: 'Caso not found' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // create attachment record; we'll set a protected download url using the attachment id
    const att = await prisma.attachments.create({
      data: {
        filename: file.originalname,
        storedFilename: file.filename,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        caso_id: casoId
      }
    });

  // Build API download URL and return it in the response.
  // NOTE: we intentionally DO NOT overwrite the stored `url` field in DB
  // because it contains the on-disk path (`/uploads/<storedFilename>`).
  const downloadUrl = `/api/attachments/${att.id}/download`;

  res.status(201).json({ id: att.id, url: downloadUrl });
  } catch (err) {
    console.error(err);
    // multer fileFilter throws an Error with message 'Invalid file type' — map to 400
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: pdf, jpg, png' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

