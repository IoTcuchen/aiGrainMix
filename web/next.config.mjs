/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        // ★ 수정됨: 프론트엔드 코드("/cuchenon/...")와 주소를 일치시킴
        source: '/cuchenon/:path*',

        // 실제 로컬 밥솥 서버(Tomcat) 주소
        destination: 'http://127.0.0.1:8080/cuchenon/:path*',
      }
    ];
  },
};

export default nextConfig;