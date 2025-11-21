/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
