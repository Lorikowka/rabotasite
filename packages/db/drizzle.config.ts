import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DB_PATH
      ? path.isAbsolute(process.env.DB_PATH)
        ? process.env.DB_PATH
        : path.resolve(ROOT, process.env.DB_PATH)
      : path.join(ROOT, 'data', 'teenwork.db'),
  },
  strict: true,
  verbose: true,
});
