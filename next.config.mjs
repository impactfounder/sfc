/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Strict Mode 비활성화 (위젯 중복 렌더링 방지)
  typescript: {
    ignoreBuildErrors: true,
    // 개발 환경에서 TypeScript 체크를 더 빠르게
    tsconfigPath: './tsconfig.json',
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
    // 개발 환경에서 컴파일 속도 개선
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Turbopack 설정 (Next.js 16에서 기본 활성화)
  turbopack: {},
  // 개발 환경 최적화 (webpack 사용 시)
  ...(process.env.NODE_ENV === 'development' && {
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
