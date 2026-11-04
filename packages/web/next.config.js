const { version: webVersion } = require('./package.json');

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function getApiRewriteBase() {
  const configuredUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!configuredUrl) {
    return null;
  }

  try {
    const parsed = new URL(configuredUrl);
    const pathname = stripTrailingSlash(parsed.pathname).replace(/\/api$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return null;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chatroom/shared'],
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || webVersion,
    NEXT_PUBLIC_APP_RELEASE_ID:
      process.env.NEXT_PUBLIC_APP_RELEASE_ID
      || process.env.APP_RELEASE_ID
      || process.env.VERCEL_GIT_COMMIT_SHA
      || process.env.RENDER_GIT_COMMIT
      || webVersion,
  },
  async rewrites() {
    const rewriteBase = getApiRewriteBase();

    if (!rewriteBase) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${rewriteBase}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
