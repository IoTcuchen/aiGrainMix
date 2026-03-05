/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/cuchenon/:path*',
        destination: 'http://127.0.0.1:8080/cuchenon/:path*',
      },
    ];
  },
};

export default nextConfig;
