/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  // Раздельные каталоги сборки: `next build` не затирает ассеты
  // уже запущенного `next dev` (иначе в деве ломаются ссылки на CSS).
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  experimental: {
    // Формируем PDF-бланки на клиенте без внешних сервисов.
    optimizePackageImports: ['@teenwork/shared'],
  },
};

export default nextConfig;
