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
