import { prisma } from "@/lib/db";
import { EstadoEvaluacion, EstadoRequisito, Prioridad } from "@prisma/client";
import { getUltimasEvaluaciones } from "@/lib/data/evaluaciones";

export type EstadoDashboard = EstadoEvaluacion | "SinEvaluar";

export interface DashboardStats {
  totalAplican: number;
  cumplen: number;
  porcentajeAvance: number;
  porEstado: Record<EstadoDashboard, number>;
  porPrioridad: Record<Prioridad, number>;
}

const ESTADOS_EVALUACION: EstadoDashboard[] = [
  EstadoEvaluacion.Cumple,
  EstadoEvaluacion.CumpleParcialmente,
  EstadoEvaluacion.NoCumple,
  EstadoEvaluacion.NoAplica,
  EstadoEvaluacion.PorEvaluar,
  "SinEvaluar",
];

const PRIORIDADES: Prioridad[] = [
  Prioridad.Critica,
  Prioridad.Alta,
  Prioridad.Media,
  Prioridad.Baja,
];

export async function getDashboardStats(): Promise<DashboardStats> {
  const requisitosAplican = await prisma.requisito.findMany({
    where: { estado: EstadoRequisito.Aplica },
    select: { id: true, prioridad: true },
  });

  const ultimaEvaluacionPorRequisito = await getUltimasEvaluaciones(
    requisitosAplican.map((r) => r.id),
  );

  const porEstado = Object.fromEntries(ESTADOS_EVALUACION.map((e) => [e, 0])) as Record<
    EstadoDashboard,
    number
  >;
  const porPrioridad = Object.fromEntries(PRIORIDADES.map((p) => [p, 0])) as Record<
    Prioridad,
    number
  >;

  let cumplen = 0;
  for (const requisito of requisitosAplican) {
    porPrioridad[requisito.prioridad] += 1;

    const ultima = ultimaEvaluacionPorRequisito.get(requisito.id);
    const estado: EstadoDashboard = ultima?.estado ?? "SinEvaluar";
    porEstado[estado] += 1;
    if (estado === EstadoEvaluacion.Cumple) cumplen += 1;
  }

  const totalAplican = requisitosAplican.length;
  const porcentajeAvance = totalAplican === 0 ? 0 : Math.round((cumplen / totalAplican) * 100);

  return { totalAplican, cumplen, porcentajeAvance, porEstado, porPrioridad };
}
