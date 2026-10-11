/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Keep heavy markdown/highlight deps out of the client bundle where possible.
    optimizePackageImports: ['lucide-react', 'date-fns'],
    // forbidden(): the admin pages answer non-admins with a real 403.
    authInterrupts: true,
  },
  serverExternalPackages: ['bcryptjs', '@prisma/client'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
