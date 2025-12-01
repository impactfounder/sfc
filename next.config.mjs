/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Strict Mode 비활성화 (위젯 중복 렌더링 방지)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // quality 100을 허용합니다.
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
