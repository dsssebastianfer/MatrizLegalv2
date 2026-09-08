import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Area,
  EstadoRequisito,
  RangoJuridico,
  NivelVigilancia,
  Prioridad,
  TipoRelacion,
  ImpactoCambio,
} from "@prisma/client";

// Este script corre fuera de Next.js (vía tsx), así que .env no se carga solo.
process.loadEnvFile(".env");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const EXCEL_PATH = path.resolve(process.cwd(), "Matriz_Legal_DSS_actualizada.xlsx");

function str(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanCodigo(raw: string): string {
  // El Excel usa un prefijo visual "   ↳ " para mostrar anidamiento; no es parte del dato.
  return raw.replace(/^[\s↳]+/, "").trim();
}

function mapRango(raw: string): RangoJuridico {
  switch (raw) {
    case "Ley":
      return RangoJuridico.Ley;
    case "Decreto/Regl.":
      return RangoJuridico.DecretoReglamento;
    case "Norma adm.":
      return RangoJuridico.NormaAdministrativa;
    default:
      throw new Error(`Rango jurídico desconocido: "${raw}"`);
  }
}

function mapVigilancia(raw: string): NivelVigilancia {
  switch (raw) {
    case "Alto":
      return NivelVigilancia.Alto;
    case "Medio":
      return NivelVigilancia.Medio;
    case "Bajo":
      return NivelVigilancia.Bajo;
    default:
      throw new Error(`Nivel de vigilancia desconocido: "${raw}"`);
  }
}

function mapEstado(raw: string): EstadoRequisito {
  switch (raw) {
    case "Aplica":
      return EstadoRequisito.Aplica;
    case "No aplica":
      return EstadoRequisito.NoAplica;
    case "Derogada":
      return EstadoRequisito.Derogada;
    case "Evaluar aplicabilidad":
      return EstadoRequisito.EvaluarAplicabilidad;
    default:
      throw new Error(`Estado de requisito desconocido: "${raw}"`);
  }
}

function mapPrioridad(raw: string): Prioridad {
  switch (raw) {
    case "Baja":
      return Prioridad.Baja;
    case "Media":
      return Prioridad.Media;
    case "Alta":
      return Prioridad.Alta;
    case "Critica": // el Excel la escribe sin tilde
    case "Crítica":
      return Prioridad.Critica;
    default:
      throw new Error(`Prioridad desconocida: "${raw}"`);
  }
}

function mapTipoRelacion(raw: string): TipoRelacion {
  switch (raw) {
    case "Principal":
      return TipoRelacion.Principal;
    case "Modifica":
      return TipoRelacion.Modifica;
    case "Reglamenta":
      return TipoRelacion.Reglamenta;
    case "Complementa":
      return TipoRelacion.Complementa;
    case "Libro":
      return TipoRelacion.Libro;
    case "Sub-parte":
      return TipoRelacion.SubParte;
    case "Reemplazada por":
      return TipoRelacion.ReemplazadaPor;
    case "Transición":
      return TipoRelacion.Transicion;
    default:
      throw new Error(`Tipo de relación desconocido: "${raw}"`);
  }
}

function mapAreas(raw: string): Area[] {
  // "Transversal" (normas de marco general) aplica a los tres sistemas.
  if (raw === "Transversal") return [Area.Calidad, Area.Ambiente, Area.SST];
  return raw.split("/").map((token) => {
    switch (token.trim()) {
      case "Calidad":
        return Area.Calidad;
      case "Ambiente":
        return Area.Ambiente;
      case "SST":
        return Area.SST;
      default:
        throw new Error(`Área desconocida: "${token}" (en "${raw}")`);
    }
  });
}

function mapImpacto(raw: string): ImpactoCambio {
  switch (raw) {
    case "Sí":
      return ImpactoCambio.Si;
    case "No aplica":
      return ImpactoCambio.NoAplica;
    case "Aplicación condicionada":
      return ImpactoCambio.AplicacionCondicionada;
    case "Aplicación indirecta":
      return ImpactoCambio.AplicacionIndirecta;
    default:
      throw new Error(`Impacto de cambio desconocido: "${raw}"`);
  }
}

interface FilaRequisito {
  legacyId: number;
  bloqueTematico: string;
  rangoJuridico: RangoJuridico;
  nivelVigilancia: NivelVigilancia;
  dependeDe: number | null;
  tipoRelacion: TipoRelacion;
  areas: Area[];
  codigoNormativo: string;
  nombreOficial: string;
  estado: EstadoRequisito;
  aplicabilidad: string | null;
  descripcion: string | null;
  requisitoArticuloClave: string | null;
  fuenteAVerificar: string | null;
  comoDemostrarCumplimiento: string | null;
  frecuenciaRevision: string | null;
  organismoFiscalizador: string | null;
  prioridad: Prioridad;
}

function leerRequisitos(wb: XLSX.WorkBook): FilaRequisito[] {
  const sheet = wb.Sheets["Matriz Legal"];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  const filas: FilaRequisito[] = [];
  for (const row of rows) {
    const id = row[0];
    // Salta el título, la nota introductoria y los encabezados de sección ("▸ MARCO GENERAL").
    if (typeof id !== "number") continue;

    filas.push({
      legacyId: id,
      bloqueTematico: str(row[1]),
      rangoJuridico: mapRango(str(row[2])),
      nivelVigilancia: mapVigilancia(str(row[3])),
      dependeDe: typeof row[4] === "number" ? row[4] : null,
      tipoRelacion: mapTipoRelacion(str(row[5])),
      areas: mapAreas(str(row[6])),
      codigoNormativo: cleanCodigo(str(row[7])),
      nombreOficial: str(row[8]),
      estado: mapEstado(str(row[9])),
      aplicabilidad: row[10] ? str(row[10]) : null,
      descripcion: row[11] ? str(row[11]) : null,
      requisitoArticuloClave: row[12] ? str(row[12]) : null,
      fuenteAVerificar: row[13] ? str(row[13]) : null,
      comoDemostrarCumplimiento: row[14] ? str(row[14]) : null,
      frecuenciaRevision: row[15] ? str(row[15]) : null,
      organismoFiscalizador: row[16] ? str(row[16]) : null,
      prioridad: mapPrioridad(str(row[17])),
    });
  }
  return filas;
}

interface FilaCambio {
  fecha: Date | null;
  tipo: string | null;
  numeroCodigo: string | null;
  nombre: string | null;
  normaOParteQueActualiza: string | null;
  requisitoBaseLegacyId: number | null;
  queCambio: string | null;
  impacto: ImpactoCambio;
  nota: string | null;
}

function leerCambios(wb: XLSX.WorkBook): FilaCambio[] {
  const sheet = wb.Sheets["Bitacora de cambios"];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  const filas: FilaCambio[] = [];
  for (const row of rows) {
    const impactoRaw = row[7];
    // Salta el título, la nota y la fila de encabezado (ninguna fila de datos tiene el impacto vacío).
    if (!impactoRaw || impactoRaw === "Impacto en DSS") continue;

    // El Excel trae fechas vacías o solo el año como texto (ej. "2005"); en
    // ambos casos queda null aquí — el año ya se conserva en "numero_codigo".
    filas.push({
      fecha: row[0] instanceof Date ? row[0] : null,
      tipo: row[1] ? str(row[1]) : null,
      numeroCodigo: row[2] ? str(row[2]) : null,
      nombre: row[3] ? str(row[3]) : null,
      normaOParteQueActualiza: row[4] ? str(row[4]) : null,
      requisitoBaseLegacyId: typeof row[5] === "number" ? row[5] : null,
      queCambio: row[6] ? str(row[6]) : null,
      impacto: mapImpacto(str(impactoRaw)),
      nota: row[8] ? str(row[8]) : null,
    });
  }
  return filas;
}

async function main() {
  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true });
  const filasRequisitos = leerRequisitos(wb);
  const filasCambios = leerCambios(wb);

  console.log(
    `Leídos ${filasRequisitos.length} requisitos y ${filasCambios.length} cambios normativos del Excel.`,
  );

  // Limpieza para que el import sea repetible.
  await prisma.cambioNormativo.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.requisitoArea.deleteMany();
  await prisma.requisito.deleteMany();
  await prisma.bloqueTematico.deleteMany();

  // orden = orden de primera aparición en el Excel (ya viene curado, no alfabético).
  const nombresBloques = [...new Set(filasRequisitos.map((f) => f.bloqueTematico))];
  const bloqueIdPorNombre = new Map<string, string>();
  for (const [index, nombre] of nombresBloques.entries()) {
    const bloque = await prisma.bloqueTematico.create({ data: { nombre, orden: index + 1 } });
    bloqueIdPorNombre.set(nombre, bloque.id);
  }

  // Paso 1: crear todos los requisitos (todavía sin norma_madre_id, porque
  // necesitamos el id generado de cada uno antes de poder enlazarlos entre sí).
  const idPorLegacyId = new Map<number, string>();
  for (const fila of filasRequisitos) {
    const requisito = await prisma.requisito.create({
      data: {
        legacyId: fila.legacyId,
        codigoNormativo: fila.codigoNormativo,
        nombreOficial: fila.nombreOficial,
        bloqueTematicoId: bloqueIdPorNombre.get(fila.bloqueTematico)!,
        estado: fila.estado,
        aplicabilidad: fila.aplicabilidad,
        rangoJuridico: fila.rangoJuridico,
        nivelVigilancia: fila.nivelVigilancia,
        descripcion: fila.descripcion,
        requisitoArticuloClave: fila.requisitoArticuloClave,
        fuenteAVerificar: fila.fuenteAVerificar,
        comoDemostrarCumplimiento: fila.comoDemostrarCumplimiento,
        frecuenciaRevision: fila.frecuenciaRevision,
        organismoFiscalizador: fila.organismoFiscalizador,
        prioridad: fila.prioridad,
        tipoRelacion: fila.tipoRelacion,
        areas: { create: fila.areas.map((area) => ({ area })) },
      },
    });
    idPorLegacyId.set(fila.legacyId, requisito.id);
  }

  // Paso 2: ahora que todos los ids existen, fijar norma_madre_id.
  for (const fila of filasRequisitos) {
    if (fila.dependeDe === null) continue;
    const normaMadreId = idPorLegacyId.get(fila.dependeDe);
    if (!normaMadreId) {
      throw new Error(
        `ID "${fila.dependeDe}" no encontrado (referenciado por el requisito ${fila.legacyId})`,
      );
    }
    await prisma.requisito.update({
      where: { id: idPorLegacyId.get(fila.legacyId)! },
      data: { normaMadreId },
    });
  }

  // Bitácora de cambios normativos. Algunas filas no tienen "ID base" (no
  // modifican ninguna norma que esté hoy en la Matriz) y quedan sin requisito asociado.
  for (const fila of filasCambios) {
    let requisitoBaseId: string | null = null;
    if (fila.requisitoBaseLegacyId !== null) {
      requisitoBaseId = idPorLegacyId.get(fila.requisitoBaseLegacyId) ?? null;
      if (!requisitoBaseId) {
        throw new Error(`ID base "${fila.requisitoBaseLegacyId}" no encontrado en la Bitácora`);
      }
    }
    await prisma.cambioNormativo.create({
      data: {
        fecha: fila.fecha,
        tipo: fila.tipo,
        numeroCodigo: fila.numeroCodigo,
        nombre: fila.nombre,
        normaOParteQueActualiza: fila.normaOParteQueActualiza,
        requisitoBaseId,
        queCambio: fila.queCambio,
        impacto: fila.impacto,
        nota: fila.nota,
      },
    });
  }

  // Usuario semilla para poder atribuir evaluaciones desde el día uno.
  await prisma.usuario.upsert({
    where: { email: "sebastian.fernandez@dss.cl" },
    update: {},
    create: { nombre: "Sebastián Fernández", email: "sebastian.fernandez@dss.cl" },
  });

  console.log(
    `Importados ${idPorLegacyId.size} requisitos, ${nombresBloques.length} bloques temáticos y ${filasCambios.length} cambios normativos.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
