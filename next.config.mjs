/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // 개발에서는 중복 렌더 경고를 피하고, 프로덕션에서는 안전하게 Strict Mode 활성화
  reactStrictMode: !isDev,
  typescript: {
    // 프로덕션 오류를 삼키지 않도록 빌드 에러를 무시하지 않습니다.
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  images: {
    // Next 이미지 최적화를 사용합니다.
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'c6a6mkohft8ir4os.public.blob.vercel-storage.com' },
    ],
    qualities: [75, 100],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizeCss: false,
    // 개발 환경에서 컴파일 속도 개선
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Turbopack 설정 (Next.js 16에서 기본 활성화)
  turbopack: {},
  // 개발 환경 최적화 (webpack 사용 시)
  ...(isDev && {
    // 개발 환경에서만 적용되는 설정
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // 클라이언트 사이드 빌드 최적화 - 개발 환경에서 컴파일 속도 향상
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        }
        // 파일 감시 최적화
        config.watchOptions = {
          ...config.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.git/**',
            '**/scripts/**',
            '**/*.md',
            '**/repomix-output.xml',
          ],
        }
      }
      return config
    },
  }),
}

export default nextConfig
