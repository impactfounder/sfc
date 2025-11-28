/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // quality 100을 허용합니다.
    qualities: [75, 100],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
