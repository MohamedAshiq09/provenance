/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Real MCP over Streamable HTTP (bare /mcp; :path* does not match it).
        source: '/mcp',
        destination: `${backendUrl}/mcp`,
      },
    ];
  },
};

export default nextConfig;
