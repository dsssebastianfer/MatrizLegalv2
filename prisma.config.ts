import { defineConfig, env } from "prisma/config";

// prisma.config.ts no carga .env automáticamente (a diferencia de versiones
// anteriores de Prisma) — se carga explícitamente aquí. Solo en local: en
// Vercel no existe archivo .env (las variables llegan directo en el entorno).
try {
  process.loadEnvFile(".env");
} catch {
  // sin .env (p. ej. en Vercel): seguimos con las variables ya presentes en el entorno.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx scripts/seed.ts",
  },
});
