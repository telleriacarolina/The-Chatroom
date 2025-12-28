const { routeProblem } = require('../LEAVING ROOM FOR THE X FACTOR/error-router');

const isDev = process.env.NODE_ENV !== 'production';
const enableDebug = isDev || process.env.LOG_LEVEL === 'debug';

function extractErrorDetail(args) {
  return args.find((arg) => arg instanceof Error) || undefined;
}

function log(level, ...args) {
  const prefix = `[${level}]`;
  const printer = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
  printer(prefix, ...args);

  if (level === 'warn' || level === 'error') {
    routeProblem({
      source: 'app',
      severity: level,
      message: args.map(String).join(' '),
      detail: extractErrorDetail(args),
    });
  }
}

const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  debug: (...args) => {
    if (enableDebug) log('debug', ...args);
  },
};

module.exports = logger;
module.exports.default = logger;
