const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');

// Protected download: only REPRESENTANTE or ADMIN can download attachments
router.get('/:id/download', authMiddleware, requireRole(['REPRESENTANTE', 'ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid attachment id' });

    const att = await prisma.attachments.findUnique({ where: { id } });
    if (!att) return res.status(404).json({ error: 'Attachment not found' });

    // The file is stored in src/uploads/<filename>
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const storedFilename = att.storedFilename || (att.url ? path.basename(att.url) : null);
  if (!storedFilename) return res.status(500).json({ error: 'Attachment metadata invalid' });

  const filePath = path.join(uploadsDir, storedFilename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });

    res.setHeader('Content-Type', att.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${att.filename}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
