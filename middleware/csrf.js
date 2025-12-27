const { validateCSRFToken } = require('../utils/security');

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const token = req.headers['x-csrf-token'] || req.headers['x-csrf'] || req.body?.csrfToken;
  const sessionToken = req.cookies?.csrfToken || req.session?.csrfToken;

  if (!token || !sessionToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  try {
    if (!validateCSRFToken(token, sessionToken)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
}

module.exports = csrfProtection;
