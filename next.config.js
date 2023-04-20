/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://celo-gpt.vercel.app/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
