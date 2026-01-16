const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
  debug: (...args) => isDev && console.log('[debug]', ...args)
};
