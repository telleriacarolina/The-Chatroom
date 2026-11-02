const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 10;

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    };
  }

  if (!/[a-z]/.test(password)) return { ok: false, error: 'Password must include at least one lowercase letter' };
  if (!/[A-Z]/.test(password)) return { ok: false, error: 'Password must include at least one uppercase letter' };
  if (!/\d/.test(password)) return { ok: false, error: 'Password must include at least one number' };
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, error: 'Password must include at least one special character' };

  return { ok: true };
}

function generateOneTimeCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function hashOneTimeCode(code, scope = '') {
  return crypto
    .createHash('sha256')
    .update(`${scope}:${String(code)}`)
    .digest('hex');
}

module.exports = {
  validatePasswordStrength,
  generateOneTimeCode,
  hashOneTimeCode
};
