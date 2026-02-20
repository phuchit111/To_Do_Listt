/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.BACKEND_API_URL || 'https://todolistt-production-a07c.up.railway.app'}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
