import { prisma } from "@/lib/db";
import {
  Area,
  EstadoRequisito,
  NivelVigilancia,
  Prioridad,
  type Requisito,
} from "@prisma/client";

export interface FiltrosMatriz {
  bloqueTematicoId?: string;
  estados?: EstadoRequisito[];
  area?: Area;
  prioridad?: Prioridad;
  nivelVigilancia?: NivelVigilancia;
  busqueda?: string;
}

const REQUISITO_INCLUDE = {
  bloqueTematico: true,
  areas: true,
} as const;

const MATRIZ_INCLUDE = {
  ...REQUISITO_INCLUDE,
  normaMadre: {
    select: { id: true, codigoNormativo: true, bloqueTematico: { select: { nombre: true } } },
  },
} as const;

export type RequisitoConRelaciones = Requisito & {
  bloqueTematico: { id: string; nombre: string; orden: number };
  areas: { area: Area }[];
  normaMadre?: { id: string; codigoNormativo: string; bloqueTematico: { nombre: string } } | null;
};

export interface NodoRequisito extends RequisitoConRelaciones {
  hijas: NodoRequisito[];
}

export interface BloqueConRequisitos {
  id: string;
  nombre: string;
  orden: number;
  requisitos: NodoRequisito[];
}

function construirArbol(requisitos: RequisitoConRelaciones[]): NodoRequisito[] {
  const porId = new Map(requisitos.map((r) => [r.id, r]));
  const hijasPorMadre = new Map<string, RequisitoConRelaciones[]>();
  const raices: RequisitoConRelaciones[] = [];

  for (const r of requisitos) {
    // Si el requisito madre no está en el conjunto filtrado, se muestra como raíz.
    if (r.normaMadreId && porId.has(r.normaMadreId)) {
      const lista = hijasPorMadre.get(r.normaMadreId) ?? [];
      lista.push(r);
      hijasPorMadre.set(r.normaMadreId, lista);
    } else {
      raices.push(r);
    }
  }

  const porLegacyId = (a: RequisitoConRelaciones, b: RequisitoConRelaciones) =>
    (a.legacyId ?? 0) - (b.legacyId ?? 0);

  function armarNodo(r: RequisitoConRelaciones): NodoRequisito {
    const hijas = (hijasPorMadre.get(r.id) ?? []).sort(porLegacyId).map(armarNodo);
    return { ...r, hijas };
  }

  return raices.sort(porLegacyId).map(armarNodo);
}

export async function getMatriz(filtros: FiltrosMatriz = {}): Promise<BloqueConRequisitos[]> {
  const termino = filtros.busqueda?.trim();
  const idNumerico = termino && /^\d+$/.test(termino) ? Number(termino) : undefined;

  const requisitos = await prisma.requisito.findMany({
    where: {
      eliminadoEn: null,
      estado: filtros.estados && filtros.estados.length > 0 ? { in: filtros.estados } : undefined,
      prioridad: filtros.prioridad,
      nivelVigilancia: filtros.nivelVigilancia,
      bloqueTematicoId: filtros.bloqueTematicoId,
      areas: filtros.area ? { some: { area: filtros.area } } : undefined,
      ...(termino
        ? {
            OR: [
              { codigoNormativo: { contains: termino, mode: "insensitive" } },
              { nombreOficial: { contains: termino, mode: "insensitive" } },
              { descripcion: { contains: termino, mode: "insensitive" } },
              { aplicabilidad: { contains: termino, mode: "insensitive" } },
              { requisitoArticuloClave: { contains: termino, mode: "insensitive" } },
              { fuenteAVerificar: { contains: termino, mode: "insensitive" } },
              { comoDemostrarCumplimiento: { contains: termino, mode: "insensitive" } },
              { organismoFiscalizador: { contains: termino, mode: "insensitive" } },
              ...(idNumerico !== undefined ? [{ legacyId: idNumerico }] : []),
            ],
          }
        : {}),
    },
    include: MATRIZ_INCLUDE,
    orderBy: [{ bloqueTematico: { orden: "asc" } }, { legacyId: "asc" }],
  });

  const bloques = new Map<string, BloqueConRequisitos>();
  const porBloque = new Map<string, RequisitoConRelaciones[]>();

  for (const r of requisitos) {
    if (!bloques.has(r.bloqueTematico.id)) {
      bloques.set(r.bloqueTematico.id, {
        id: r.bloqueTematico.id,
        nombre: r.bloqueTematico.nombre,
        orden: r.bloqueTematico.orden,
        requisitos: [],
      });
    }
    const lista = porBloque.get(r.bloqueTematico.id) ?? [];
    lista.push(r);
    porBloque.set(r.bloqueTematico.id, lista);
  }

  const resultado = [...bloques.values()].sort((a, b) => a.orden - b.orden);
  for (const bloque of resultado) {
    bloque.requisitos = construirArbol(porBloque.get(bloque.id) ?? []);
  }
  return resultado;
}

// Versión liviana del árbol (solo lo necesario para el índice lateral y la
// navegación anterior/siguiente), para no mandar el requisito completo al cliente.
export interface IndiceNodo {
  id: string;
  legacyId: number | null;
  codigoNormativo: string;
  nombreOficial: string;
  hijas: IndiceNodo[];
}

export interface IndiceBloque {
  id: string;
  nombre: string;
  items: IndiceNodo[];
}

function aIndiceNodo(nodo: NodoRequisito): IndiceNodo {
  return {
    id: nodo.id,
    legacyId: nodo.legacyId,
    codigoNormativo: nodo.codigoNormativo,
    nombreOficial: nodo.nombreOficial,
    hijas: nodo.hijas.map(aIndiceNodo),
  };
}

/**
 * Índice de todas las normas agrupadas por bloque temático, con el mismo
 * orden y anidamiento con el que se muestran en la Matriz. Se usa tanto para
 * el índice lateral del detalle como para la navegación anterior/siguiente.
 */
export async function getIndiceNormas(): Promise<IndiceBloque[]> {
  const bloques = await getMatriz();
  return bloques.map((bloque) => ({
    id: bloque.id,
    nombre: bloque.nombre,
    items: bloque.requisitos.map(aIndiceNodo),
  }));
}

export function flattenIndice(bloques: IndiceBloque[]): IndiceNodo[] {
  const resultado: IndiceNodo[] = [];

  function recorrer(nodos: IndiceNodo[]) {
    for (const nodo of nodos) {
      resultado.push(nodo);
      recorrer(nodo.hijas);
    }
  }

  for (const bloque of bloques) recorrer(bloque.items);
  return resultado;
}

export async function getRequisitoDetalle(id: string) {
  return prisma.requisito.findUnique({
    where: { id },
    include: {
      ...REQUISITO_INCLUDE,
      normaMadre: { select: { id: true, codigoNormativo: true, nombreOficial: true } },
      normasHijas: {
        select: { id: true, codigoNormativo: true, nombreOficial: true, tipoRelacion: true },
        orderBy: { legacyId: "asc" },
      },
      evaluaciones: {
        include: { usuario: { select: { id: true, nombre: true } } },
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      },
      cambios: {
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export async function listBloquesTematicos() {
  return prisma.bloqueTematico.findMany({ orderBy: { orden: "asc" } });
}

// Fila plana (sin relaciones), usada para comparar "antes" y "después" de una
// edición y armar el historial de cambios legible (ver src/lib/historial.ts).
export async function getRequisitoRaw(id: string) {
  return prisma.requisito.findUniqueOrThrow({ where: { id } });
}

export async function getAreasRequisito(id: string): Promise<Area[]> {
  const filas = await prisma.requisitoArea.findMany({ where: { requisitoId: id }, select: { area: true } });
  return filas.map((f) => f.area);
}

export async function getNombreBloqueTematico(id: string): Promise<string | null> {
  const bloque = await prisma.bloqueTematico.findUnique({ where: { id }, select: { nombre: true } });
  return bloque?.nombre ?? null;
}

export async function getCodigoNormativoRequisito(id: string): Promise<string | null> {
  const requisito = await prisma.requisito.findUnique({ where: { id }, select: { codigoNormativo: true } });
  return requisito?.codigoNormativo ?? null;
}

export interface RequisitoFormData {
  codigoNormativo: string;
  nombreOficial: string;
  bloqueTematicoId: string;
  estado: EstadoRequisito;
  aplicabilidad?: string | null;
  rangoJuridico: Requisito["rangoJuridico"];
  nivelVigilancia: NivelVigilancia;
  descripcion?: string | null;
  requisitoArticuloClave?: string | null;
  fuenteAVerificar?: string | null;
  comoDemostrarCumplimiento?: string | null;
  frecuenciaRevision?: string | null;
  organismoFiscalizador?: string | null;
  prioridad: Prioridad;
  normaMadreId?: string | null;
  tipoRelacion: Requisito["tipoRelacion"];
  areas: Area[];
}

export async function createRequisito(data: RequisitoFormData) {
  return prisma.requisito.create({
    data: {
      ...data,
      areas: { create: data.areas.map((area) => ({ area })) },
    },
  });
}

export async function updateRequisito(id: string, data: RequisitoFormData) {
  return prisma.$transaction([
    prisma.requisitoArea.deleteMany({ where: { requisitoId: id } }),
    prisma.requisito.update({
      where: { id },
      data: {
        ...data,
        areas: { create: data.areas.map((area) => ({ area })) },
      },
    }),
  ]);
}

export interface DatosGeneralesFormData {
  bloqueTematicoId: string;
  rangoJuridico: Requisito["rangoJuridico"];
  frecuenciaRevision?: string | null;
  fuenteAVerificar?: string | null;
  organismoFiscalizador?: string | null;
}

export async function updateDatosGenerales(id: string, data: DatosGeneralesFormData) {
  return prisma.requisito.update({ where: { id }, data });
}

export interface ContenidoAplicabilidadFormData {
  descripcion?: string | null;
  aplicabilidad?: string | null;
  requisitoArticuloClave?: string | null;
  comoDemostrarCumplimiento?: string | null;
}

export async function updateContenidoAplicabilidad(id: string, data: ContenidoAplicabilidadFormData) {
  return prisma.requisito.update({ where: { id }, data });
}

export async function listRequisitosParaSelector() {
  return prisma.requisito.findMany({
    where: { eliminadoEn: null },
    select: { id: true, codigoNormativo: true, nombreOficial: true },
    orderBy: { legacyId: "asc" },
  });
}

export async function softDeleteRequisito(id: string) {
  return prisma.requisito.update({ where: { id }, data: { eliminadoEn: new Date() } });
}

export async function restoreRequisito(id: string) {
  return prisma.requisito.update({ where: { id }, data: { eliminadoEn: null } });
}
