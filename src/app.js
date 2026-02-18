require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const submissionsRouter = require('./routes/submissions');
const authRouter = require('./routes/auth');
const attachmentsRouter = require('./routes/attachments');
const workersRouter = require('./routes/workers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 requests per minute
app.use(limiter);

app.use('/api/submissions', submissionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/workers', workersRouter);

// NOTE: uploaded files are NOT served publicly; use the protected attachments route.

app.get('/', (req, res) => res.send('CCOO Glovo Backend API'));

module.exports = app;
