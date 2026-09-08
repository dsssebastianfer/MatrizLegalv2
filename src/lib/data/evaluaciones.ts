import { prisma } from "@/lib/db";
import { EstadoEvaluacion } from "@prisma/client";

export interface NuevaEvaluacion {
  requisitoId: string;
  estado: EstadoEvaluacion;
  evidencia?: string | null;
  responsable?: string | null;
  fecha: Date;
  usuarioId: string;
}

// Histórico: solo se agregan filas nuevas, nunca se actualizan ni se borran.
export async function registrarEvaluacion(data: NuevaEvaluacion) {
  return prisma.evaluacion.create({ data });
}

/**
 * Última evaluación por requisito (la de fecha más reciente; ante empate, la
 * insertada más recientemente). No se guarda como columna: se recalcula acá
 * para que el histórico y el "estado actual" nunca queden desincronizados.
 */
export async function getUltimasEvaluaciones(requisitoIds?: string[]) {
  const evaluaciones = await prisma.evaluacion.findMany({
    where: requisitoIds ? { requisitoId: { in: requisitoIds } } : undefined,
    orderBy: [{ requisitoId: "asc" }, { fecha: "desc" }, { createdAt: "desc" }],
  });

  const ultimaPorRequisito = new Map<string, (typeof evaluaciones)[number]>();
  for (const evaluacion of evaluaciones) {
    if (!ultimaPorRequisito.has(evaluacion.requisitoId)) {
      ultimaPorRequisito.set(evaluacion.requisitoId, evaluacion);
    }
  }
  return ultimaPorRequisito;
}
