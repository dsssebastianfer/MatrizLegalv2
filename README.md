# Matriz Legal DSS

Sistema interno para gestionar los requisitos legales de DSS S.A., alineado a ISO 9001/14001/45001.
Ver el plan de diseño en `C:\Users\dss_264\.claude\plans\continua-virtual-cherny.md` para el esquema de
datos completo y las decisiones tomadas.

Estado actual: **versión local**, sin login todavía (se agrega más adelante, junto con el despliegue a
Vercel/Supabase).

## Primer arranque (una sola vez)

1. Instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/) y dejarlo corriendo.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Levantar Postgres local (usa la CLI de Supabase, ya configurada en `supabase/config.toml`):
   ```bash
   npx supabase start
   ```
   La primera vez descarga las imágenes de Docker; puede tardar unos minutos. Al terminar muestra las
   URLs locales (Studio, API, etc.) — no se necesitan todavía, salvo el puerto de Postgres (54322, ya
   configurado en `.env`).
4. Crear las tablas (aplica `prisma/schema.prisma` a la base):
   ```bash
   npm run db:migrate
   ```
5. Importar los datos del Excel semilla (`Matriz_Legal_DSS_seed_v2.xlsx`):
   ```bash
   npm run db:seed
   ```
6. Levantar la app:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000).

## Uso diario

- `npx supabase start` / `npx supabase stop` — prender/apagar la base de datos local.
- `npm run dev` — servidor de desarrollo de Next.js.
- `npm run db:studio` — abre Prisma Studio para ver/editar filas a mano en el navegador.

## Si cambias el esquema (`prisma/schema.prisma`)

```bash
npm run db:migrate   # crea y aplica una nueva migración
npm run db:seed      # opcional: re-importa el Excel desde cero (borra y vuelve a cargar la matriz)
```

## Estructura del proyecto

- `prisma/schema.prisma` — esquema de datos (Postgres).
- `prisma.config.ts` — configuración de Prisma (conexión, comando de seed).
- `scripts/seed.ts` — importa `Matriz_Legal_DSS_seed_v2.xlsx` a la base.
- `src/lib/db.ts` — cliente de Prisma (singleton).
- `src/lib/data/*` — toda la capa de acceso a datos (única puerta de entrada a la base; las páginas no
  llaman a Prisma directo). Migrar a Supabase en la nube más adelante debería tocar solo esta capa.
- `src/lib/actions/*` — Server Actions (mutaciones desde formularios).
- `src/app/*` — páginas (Dashboard, Matriz, detalle de requisito, Bitácora, Vigilancia, Usuarios).
