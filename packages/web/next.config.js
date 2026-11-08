function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function normalizeRewriteBase(rawValue) {
  if (!rawValue) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith('/')) {
    return stripTrailingSlash(trimmedValue) || '/';
  }

  try {
    const parsed = new URL(trimmedValue);
    let pathname = stripTrailingSlash(parsed.pathname);
    pathname = pathname.replace(/\/api$/, '').replace(/\/socket\.io$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return null;
  }
}

function getApiRewriteBase() {
  return normalizeRewriteBase(process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL);
}

function getSocketRewriteBase() {
  return normalizeRewriteBase(process.env.SOCKET_INTERNAL_URL || process.env.NEXT_PUBLIC_SOCKET_URL);
}

function warnIfMissingBackendRewriteConfig(apiRewriteBase, socketRewriteBase) {
  const missing = [];

  if (!apiRewriteBase) {
    missing.push('API_INTERNAL_URL or NEXT_PUBLIC_API_URL (required for /api/:path*)');
  }

  if (!socketRewriteBase) {
    missing.push('SOCKET_INTERNAL_URL or NEXT_PUBLIC_SOCKET_URL (required for /socket.io/:path*)');
  }

  if (missing.length > 0) {
    console.warn(
      '[chatroom] Missing deployment rewrite configuration. Backend routes are not proxied until the required Vercel Preview/Production env vars are configured: ' +
        missing.join('; ')
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chatroom/shared'],
  async rewrites() {
    const apiRewriteBase = getApiRewriteBase();
    const socketRewriteBase = getSocketRewriteBase();
    const rewrites = [];

    warnIfMissingBackendRewriteConfig(apiRewriteBase, socketRewriteBase);

    if (apiRewriteBase) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${apiRewriteBase}/api/:path*`,
      });
    }

    if (socketRewriteBase) {
      rewrites.push({
        source: '/socket.io/:path*',
        destination: `${socketRewriteBase}/socket.io/:path*`,
      });
    }

    return rewrites;
  },
};

module.exports = nextConfig;
