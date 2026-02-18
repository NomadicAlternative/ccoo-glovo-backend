const { normalizeExpiresIn } = require('./jwtExpiry');

function validateEnv({ allowTest = false } = {}) {
  const errors = [];
  const env = process.env.NODE_ENV || 'development';

  // JWT secret is required in non-test environments
  if (!(allowTest && env === 'test')) {
    if (!process.env.JWT_SECRET) errors.push('JWT_SECRET is required');
  }

  // Validate JWT_EXPIRES_IN if present
  const jwtCfg = process.env.JWT_EXPIRES_IN;
  if (jwtCfg) {
    const norm = normalizeExpiresIn(jwtCfg);
    // normalizeExpiresIn returns null for 'never', a number/string otherwise
    if (typeof norm === 'undefined') errors.push('JWT_EXPIRES_IN has an unsupported format');
  }

  // Validate refresh expires format if present
  const refreshCfg = process.env.JWT_REFRESH_EXPIRES_IN;
  if (refreshCfg && refreshCfg.trim().length === 0) errors.push('JWT_REFRESH_EXPIRES_IN should not be empty');

  if (errors.length) {
    const msg = `Environment validation failed:\n - ${errors.join('\n - ')}`;
    // In test we don't throw to keep tests flexible; caller can decide
    throw new Error(msg);
  }
}

module.exports = { validateEnv };
