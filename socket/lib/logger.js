const { sanitizeLogData } = require('../../shared/schemas');

function formatLog(level, ...args) {
  const safeArgs = args.map((arg) => sanitizeLogData(arg));
  return console[level](`[${level.toUpperCase()}]`, new Date().toISOString(), ...safeArgs);
}

module.exports = {
  info: (...args) => formatLog('log', ...args),
  warn: (...args) => formatLog('warn', ...args),
  error: (...args) => formatLog('error', ...args),
  debug: (...args) => {
    if (process.env.DEBUG) formatLog('log', ...args);
  }
};
