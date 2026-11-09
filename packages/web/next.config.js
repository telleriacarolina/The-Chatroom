const { version: webVersion } = require('./package.json');

function normalizeReleaseId(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized && normalized !== 'null' ? normalized : null;
}

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
const releaseId =
  normalizeReleaseId(process.env.NEXT_PUBLIC_APP_RELEASE_ID)
  || normalizeReleaseId(process.env.APP_RELEASE_ID)
  || normalizeReleaseId(process.env.VERCEL_GIT_COMMIT_SHA)
  || normalizeReleaseId(process.env.RENDER_GIT_COMMIT);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chatroom/shared'],
  env: {
    NEXT_PUBLIC_APP_VERSION: normalizeReleaseId(process.env.NEXT_PUBLIC_APP_VERSION) || webVersion,
    NEXT_PUBLIC_APP_RELEASE_ID: releaseId,
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
