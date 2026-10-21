// Exporta todos los datos de la base actual (Postgres) a un SQL compatible con
// MariaDB, para cargarlo sobre migracion/01_schema_mariadb.sql.
//
// Uso (apuntando a la base de producción, vía pooler de sesión de Supabase):
//   EXPORT_DATABASE_URL="postgresql://..." npx tsx scripts/exportar-mariadb.ts
//
// Genera migracion/02_datos_mariadb.sql (no se commitea: contiene datos internos).
import { writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const url = process.env.EXPORT_DATABASE_URL;
if (!url) throw new Error("Falta EXPORT_DATABASE_URL");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

// Prisma entrega los enums por su nombre de identificador; la base guarda el
// valor de @map. Estos mapas replican los @map de prisma/schema.prisma.
const ENUMS: Record<string, Record<string, string>> = {
  estadoRequisito: { NoAplica: "No aplica", EvaluarAplicabilidad: "Evaluar aplicabilidad" },
  rangoJuridico: { DecretoReglamento: "Decreto/Reglamento", NormaAdministrativa: "Norma administrativa" },
  prioridad: { Critica: "Crítica" },
  tipoRelacion: { SubParte: "Sub-parte", ReemplazadaPor: "Reemplazada por", Transicion: "Transición" },
  estadoEvaluacion: {
    CumpleParcialmente: "Cumple parcialmente",
    NoCumple: "No cumple",
    NoAplica: "No aplica",
    PorEvaluar: "Por evaluar",
  },
  impactoCambio: {
    Si: "Sí",
    NoAplica: "No aplica",
    AplicacionCondicionada: "Aplicación condicionada",
    AplicacionIndirecta: "Aplicación indirecta",
  },
  tipoEventoHistorial: {
    CreacionRequisito: "Creación de norma",
    EdicionRequisito: "Edición de norma",
    RegistroEvaluacion: "Registro de evaluación",
    EliminacionRequisito: "Eliminación de norma",
    RestauracionRequisito: "Restauración de norma",
    CreacionCambio: "Registro en bitácora",
    EdicionCambio: "Edición en bitácora",
    EliminacionCambio: "Eliminación en bitácora",
    RestauracionCambio: "Restauración en bitácora",
  },
};

const en = (tipo: keyof typeof ENUMS, valor: string) => ENUMS[tipo][valor] ?? valor;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

// Fechas en UTC (así las guarda la app original).
function fechaHora(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
}

function soloFecha(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function sql(v: unknown, tipo: "texto" | "fecha" | "fechaHora" | "json" | "numero" = "texto"): string {
  if (v === null || v === undefined) return "NULL";
  if (tipo === "numero") return String(v);
  if (tipo === "fecha") return `'${soloFecha(v as Date)}'`;
  if (tipo === "fechaHora") return `'${fechaHora(v as Date)}'`;
  const s = tipo === "json" ? JSON.stringify(v) : String(v);
  const escapado = s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\0/g, "\\0");
  return `'${escapado}'`;
}

const salida: string[] = [];
const conteos: Record<string, number> = {};

function insertar(tabla: string, columnas: string[], filas: string[][]) {
  conteos[tabla] = filas.length;
  salida.push(`\n-- ${tabla} (${filas.length} filas)`);
  for (let i = 0; i < filas.length; i += 50) {
    const lote = filas.slice(i, i + 50).map((f) => `  (${f.join(", ")})`);
    salida.push(`INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES\n${lote.join(",\n")};`);
  }
}

async function main() {
  salida.push(
    "-- Matriz Legal DSS — datos exportados para MariaDB",
    `-- Generado: ${new Date().toISOString()}`,
    "-- Ejecutar DESPUÉS de 01_schema_mariadb.sql. Fechas/horas en UTC.",
    "SET NAMES utf8mb4;",
    "START TRANSACTION;",
  );

  const bloques = await prisma.bloqueTematico.findMany({ orderBy: { orden: "asc" } });
  insertar(
    "bloque_tematico",
    ["id", "nombre", "orden"],
    bloques.map((b) => [sql(b.id), sql(b.nombre), sql(b.orden, "numero")]),
  );

  // Primera pasada sin norma_madre_id (FK a la misma tabla); se completa abajo.
  const requisitos = await prisma.requisito.findMany({ orderBy: { legacyId: "asc" } });
  insertar(
    "requisito",
    [
      "id", "legacy_id", "codigo_normativo", "nombre_oficial", "bloque_tematico_id", "estado",
      "aplicabilidad", "rango_juridico", "nivel_vigilancia", "descripcion", "requisito_articulo_clave",
      "fuente_a_verificar", "como_demostrar_cumplimiento", "frecuencia_revision", "organismo_fiscalizador",
      "prioridad", "norma_madre_id", "tipo_relacion", "eliminado_en", "created_at", "updated_at",
    ],
    requisitos.map((r) => [
      sql(r.id), sql(r.legacyId, "numero"), sql(r.codigoNormativo), sql(r.nombreOficial),
      sql(r.bloqueTematicoId), sql(en("estadoRequisito", r.estado)), sql(r.aplicabilidad),
      sql(en("rangoJuridico", r.rangoJuridico)), sql(r.nivelVigilancia), sql(r.descripcion),
      sql(r.requisitoArticuloClave), sql(r.fuenteAVerificar), sql(r.comoDemostrarCumplimiento),
      sql(r.frecuenciaRevision), sql(r.organismoFiscalizador), sql(en("prioridad", r.prioridad)),
      "NULL", sql(en("tipoRelacion", r.tipoRelacion)), sql(r.eliminadoEn, "fechaHora"),
      sql(r.createdAt, "fechaHora"), sql(r.updatedAt, "fechaHora"),
    ]),
  );

  const conMadre = requisitos.filter((r) => r.normaMadreId);
  salida.push(`\n-- requisito: norma madre (${conMadre.length} filas)`);
  for (const r of conMadre) {
    salida.push(`UPDATE requisito SET norma_madre_id = ${sql(r.normaMadreId)} WHERE id = ${sql(r.id)};`);
  }

  const areas = await prisma.requisitoArea.findMany();
  insertar(
    "requisito_area",
    ["requisito_id", "area"],
    areas.map((a) => [sql(a.requisitoId), sql(a.area)]),
  );

  const evaluaciones = await prisma.evaluacion.findMany({
    include: { usuario: { select: { nombre: true } } },
    orderBy: { createdAt: "asc" },
  });
  insertar(
    "evaluacion",
    ["id", "requisito_id", "estado", "evidencia", "responsable", "fecha", "registrado_por", "created_at"],
    evaluaciones.map((e) => [
      sql(e.id), sql(e.requisitoId), sql(en("estadoEvaluacion", e.estado)), sql(e.evidencia),
      sql(e.responsable), sql(e.fecha, "fecha"), sql(e.usuario.nombre), sql(e.createdAt, "fechaHora"),
    ]),
  );

  const cambios = await prisma.cambioNormativo.findMany({ orderBy: { createdAt: "asc" } });
  insertar(
    "cambio_normativo",
    [
      "id", "fecha", "tipo", "numero_codigo", "nombre", "norma_o_parte_que_actualiza",
      "requisito_base_id", "que_cambio", "impacto", "nota", "eliminado_en", "created_at", "updated_at",
    ],
    cambios.map((c) => [
      sql(c.id), sql(c.fecha, "fecha"), sql(c.tipo), sql(c.numeroCodigo), sql(c.nombre),
      sql(c.normaOParteQueActualiza), sql(c.requisitoBaseId), sql(c.queCambio),
      sql(en("impactoCambio", c.impacto)), sql(c.nota), sql(c.eliminadoEn, "fechaHora"),
      sql(c.createdAt, "fechaHora"), sql(c.updatedAt, "fechaHora"),
    ]),
  );

  const fuentes = await prisma.fuenteVigilancia.findMany({ orderBy: { createdAt: "asc" } });
  insertar(
    "fuente_vigilancia",
    ["id", "nombre", "url", "frecuencia", "responsable", "ultima_revision", "notas", "created_at", "updated_at"],
    fuentes.map((f) => [
      sql(f.id), sql(f.nombre), sql(f.url), sql(f.frecuencia), sql(f.responsable),
      sql(f.ultimaRevision, "fecha"), sql(f.notas), sql(f.createdAt, "fechaHora"), sql(f.updatedAt, "fechaHora"),
    ]),
  );

  const historial = await prisma.historialCambio.findMany({ orderBy: { createdAt: "asc" } });
  insertar(
    "historial_cambio",
    [
      "id", "tipo", "requisito_id", "cambio_normativo_id", "codigo_normativo", "usuario_nombre", "resumen",
      "cambios", "created_at",
    ],
    historial.map((h) => [
      sql(h.id), sql(en("tipoEventoHistorial", h.tipo)), sql(h.requisitoId), sql(h.cambioNormativoId),
      sql(h.codigoNormativo),
      sql(h.usuarioNombre), sql(h.resumen), sql(h.cambios, "json"), sql(h.createdAt, "fechaHora"),
    ]),
  );

  salida.push("\nCOMMIT;", "");
  writeFileSync("migracion/02_datos_mariadb.sql", salida.join("\n"), "utf8");

  console.log("Exportado a migracion/02_datos_mariadb.sql");
  for (const [tabla, n] of Object.entries(conteos)) console.log(`  ${tabla}: ${n}`);
  console.log(`  requisito con norma madre: ${conMadre.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
