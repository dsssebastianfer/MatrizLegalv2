-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('Calidad', 'Ambiente', 'SST');

-- CreateEnum
CREATE TYPE "EstadoRequisito" AS ENUM ('Aplica', 'No aplica', 'Derogada', 'Evaluar aplicabilidad');

-- CreateEnum
CREATE TYPE "RangoJuridico" AS ENUM ('Ley', 'Decreto/Reglamento', 'Norma administrativa');

-- CreateEnum
CREATE TYPE "NivelVigilancia" AS ENUM ('Alto', 'Medio', 'Bajo');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('Baja', 'Media', 'Alta', 'Crítica');

-- CreateEnum
CREATE TYPE "TipoRelacion" AS ENUM ('Principal', 'Modifica', 'Reglamenta', 'Complementa', 'Libro', 'Sub-parte', 'Reemplazada por', 'Transición');

-- CreateEnum
CREATE TYPE "EstadoEvaluacion" AS ENUM ('Cumple', 'Cumple parcialmente', 'No cumple', 'No aplica', 'Por evaluar');

-- CreateEnum
CREATE TYPE "ImpactoCambio" AS ENUM ('Sí', 'No aplica', 'Aplicación condicionada', 'Aplicación indirecta');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloque_tematico" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "bloque_tematico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisito" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "codigo_normativo" TEXT NOT NULL,
    "nombre_oficial" TEXT NOT NULL,
    "bloque_tematico_id" TEXT NOT NULL,
    "estado" "EstadoRequisito" NOT NULL,
    "aplicabilidad" TEXT,
    "rango_juridico" "RangoJuridico" NOT NULL,
    "nivel_vigilancia" "NivelVigilancia" NOT NULL,
    "descripcion" TEXT,
    "requisito_articulo_clave" TEXT,
    "fuente_a_verificar" TEXT,
    "como_demostrar_cumplimiento" TEXT,
    "frecuencia_revision" TEXT,
    "organismo_fiscalizador" TEXT,
    "prioridad" "Prioridad" NOT NULL,
    "norma_madre_id" TEXT,
    "tipo_relacion" "TipoRelacion" NOT NULL DEFAULT 'Principal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisito_area" (
    "requisito_id" TEXT NOT NULL,
    "area" "Area" NOT NULL,

    CONSTRAINT "requisito_area_pkey" PRIMARY KEY ("requisito_id","area")
);

-- CreateTable
CREATE TABLE "evaluacion" (
    "id" TEXT NOT NULL,
    "requisito_id" TEXT NOT NULL,
    "estado" "EstadoEvaluacion" NOT NULL,
    "evidencia" TEXT,
    "responsable" TEXT,
    "fecha" DATE NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambio_normativo" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "tipo" TEXT,
    "numero_codigo" TEXT,
    "nombre" TEXT,
    "norma_o_parte_que_actualiza" TEXT,
    "requisito_base_id" TEXT,
    "que_cambio" TEXT,
    "impacto" "ImpactoCambio" NOT NULL,
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cambio_normativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuente_vigilancia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT,
    "frecuencia" TEXT,
    "responsable" TEXT,
    "ultima_revision" DATE,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuente_vigilancia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bloque_tematico_nombre_key" ON "bloque_tematico"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "requisito_legacy_id_key" ON "requisito"("legacy_id");

-- CreateIndex
CREATE INDEX "requisito_bloque_tematico_id_idx" ON "requisito"("bloque_tematico_id");

-- CreateIndex
CREATE INDEX "requisito_norma_madre_id_idx" ON "requisito"("norma_madre_id");

-- CreateIndex
CREATE INDEX "requisito_estado_idx" ON "requisito"("estado");

-- CreateIndex
CREATE INDEX "requisito_prioridad_idx" ON "requisito"("prioridad");

-- CreateIndex
CREATE INDEX "requisito_nivel_vigilancia_idx" ON "requisito"("nivel_vigilancia");

-- CreateIndex
CREATE INDEX "evaluacion_requisito_id_fecha_idx" ON "evaluacion"("requisito_id", "fecha");

-- CreateIndex
CREATE INDEX "cambio_normativo_requisito_base_id_idx" ON "cambio_normativo"("requisito_base_id");

-- AddForeignKey
ALTER TABLE "requisito" ADD CONSTRAINT "requisito_bloque_tematico_id_fkey" FOREIGN KEY ("bloque_tematico_id") REFERENCES "bloque_tematico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisito" ADD CONSTRAINT "requisito_norma_madre_id_fkey" FOREIGN KEY ("norma_madre_id") REFERENCES "requisito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisito_area" ADD CONSTRAINT "requisito_area_requisito_id_fkey" FOREIGN KEY ("requisito_id") REFERENCES "requisito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion" ADD CONSTRAINT "evaluacion_requisito_id_fkey" FOREIGN KEY ("requisito_id") REFERENCES "requisito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion" ADD CONSTRAINT "evaluacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambio_normativo" ADD CONSTRAINT "cambio_normativo_requisito_base_id_fkey" FOREIGN KEY ("requisito_base_id") REFERENCES "requisito"("id") ON DELETE SET NULL ON UPDATE CASCADE;
