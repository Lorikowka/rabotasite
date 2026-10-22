import fs from 'node:fs';
import path from 'node:path';

/**
 * Читает .env/.env.local вручную: конфиг Next загружается раньше,
 * чем сам Next подхватывает переменные окружения.
 */
function readEnvFiles(dir) {
  const result = {};
  for (const name of ['.env.local', '.env']) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const index = line.indexOf('=');
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (result[key] === undefined) result[key] = value;
    }
  }
  return result;
}

const fileEnv = readEnvFiles(process.cwd());

/** Внутренний адрес API (Next ходит на него с сервера и проксирует запросы браузера). */
const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? fileEnv.API_INTERNAL_URL ?? 'http://127.0.0.1:4000';

/** Публичный адрес API для браузера. Пусто — запросы идут через прокси Next (same-origin). */
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? fileEnv.NEXT_PUBLIC_API_URL ?? '';

const isDev = process.env.NODE_ENV !== 'production';

const connectSrc = [
  "'self'",
  PUBLIC_API_URL.startsWith('http') ? PUBLIC_API_URL : null,
  // WebSocket нужен для HMR в dev-режиме.
  ...(isDev ? ['ws:', 'wss:'] : []),
]
  .filter(Boolean)
  .join(' ');

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

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
  // Запросы браузера к API проксируются через Next (same-origin).
  // Благодаря этому сайт открывается с телефона в локальной сети:
  // не нужно знать IP ноутбука и не нужны CORS-исключения.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
  // Заголовки безопасности.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
