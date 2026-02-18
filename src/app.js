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
const adminRouter = require('./routes/admin');
const { validateEnv } = require('./utils/env');

// validate environment (throws on misconfiguration)
try {
	validateEnv({ allowTest: true });
} catch (err) {
	// In production we want to crash early; when running tests this will be allowed
	// but still useful to see the message in logs
	console.error(err.message);
	if (process.env.NODE_ENV !== 'test') {
		process.exit(1);
	}
}

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
app.use('/api/admin', adminRouter);

// NOTE: uploaded files are NOT served publicly; use the protected attachments route.

app.get('/', (req, res) => res.send('CCOO Glovo Backend API'));

module.exports = app;
