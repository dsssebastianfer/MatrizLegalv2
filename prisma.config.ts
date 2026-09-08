import { defineConfig, env } from "prisma/config";

// prisma.config.ts no carga .env automáticamente (a diferencia de versiones
// anteriores de Prisma) — se carga explícitamente aquí.
process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx scripts/seed.ts",
  },
});
