// Utilities to handle JWT expiry configuration values.
// Supports strings like 'never', '15m', '30d', '1h', '45s' or numeric seconds.

function isNever(cfg) {
  return typeof cfg === 'string' && cfg.toLowerCase() === 'never';
}

function normalizeExpiresIn(cfg) {
  // Return null for 'never' to indicate no expiresIn should be passed to jwt.sign
  if (!cfg) return '15m';
  if (isNever(cfg)) return null;
  // If it's numeric string or number, return as Number (seconds)
  if (!isNaN(cfg)) return Number(cfg);
  // Allow common formats like '15m', '1h', '30d', '45s'
  const m = /^\s*(\d+)\s*([smhd])\s*$/i.exec(cfg);
  if (m) {
    const value = m[1];
    const unit = m[2].toLowerCase();
    // jwt accepts strings like '15m', '1h', '30d', so return original trimmed
    return `${value}${unit}`;
  }
  // Fallback: return as-is (jwt will validate or throw)
  return cfg;
}

function parseDurationToDate(cfg) {
  // For refresh token expiry -> return a Date if cfg represents a duration
  if (!cfg) return null;
  if (isNever(cfg)) return null;
  // numeric -> seconds
  if (!isNaN(cfg)) {
    const secs = Number(cfg);
    return new Date(Date.now() + secs * 1000);
  }
  const m = /^\s*(\d+)\s*([smhd])\s*$/i.exec(cfg);
  if (m) {
    const value = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    let ms = 0;
    switch (unit) {
      case 's': ms = value * 1000; break;
      case 'm': ms = value * 60 * 1000; break;
      case 'h': ms = value * 60 * 60 * 1000; break;
      case 'd': ms = value * 24 * 60 * 60 * 1000; break;
      default: ms = 0;
    }
    if (ms > 0) return new Date(Date.now() + ms);
  }
  // Unknown format
  return null;
}

module.exports = {
  normalizeExpiresIn,
  parseDurationToDate,
};
