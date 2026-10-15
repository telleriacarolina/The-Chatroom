const isDev = process.env.NODE_ENV !== 'production';
const enableDebug = isDev || process.env.LOG_LEVEL === 'debug';

function extractErrorDetail(args) {
  return args.find((arg) => arg instanceof Error) || undefined;
}

function log(level, ...args) {
  const prefix = `[${level}]`;
  const printer = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
  printer(prefix, ...args);
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
