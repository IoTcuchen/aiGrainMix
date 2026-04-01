/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 네이티브 모듈(better-sqlite3)을 webpack 번들링에서 제외 (Next.js 14) ──
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },

  async rewrites() {
    return [
      {
        source: '/cuchen-proxy/:path*',
        destination: 'http://127.0.0.1:8080/cuchenon/:path*',
      }
    ];
  },
};

export default nextConfig;
