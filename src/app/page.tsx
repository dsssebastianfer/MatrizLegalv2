import { getDashboardStats } from "@/lib/data/dashboard";
import { EstadoEvaluacion, Prioridad } from "@prisma/client";

export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, string> = {
  [EstadoEvaluacion.Cumple]: "Cumple",
  [EstadoEvaluacion.CumpleParcialmente]: "Cumple parcialmente",
  [EstadoEvaluacion.NoCumple]: "No cumple",
  [EstadoEvaluacion.NoAplica]: "No aplica",
  [EstadoEvaluacion.PorEvaluar]: "Por evaluar",
  SinEvaluar: "Sin evaluar",
};

const COLOR_ESTADO: Record<string, string> = {
  [EstadoEvaluacion.Cumple]: "bg-emerald-500",
  [EstadoEvaluacion.CumpleParcialmente]: "bg-amber-500",
  [EstadoEvaluacion.NoCumple]: "bg-red-500",
  [EstadoEvaluacion.NoAplica]: "bg-gray-400",
  [EstadoEvaluacion.PorEvaluar]: "bg-sky-400",
  SinEvaluar: "bg-gray-300",
};

const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  [Prioridad.Critica]: "Crítica",
  [Prioridad.Alta]: "Alta",
  [Prioridad.Media]: "Media",
  [Prioridad.Baja]: "Baja",
};

const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  [Prioridad.Critica]: "bg-red-500",
  [Prioridad.Alta]: "bg-orange-500",
  [Prioridad.Media]: "bg-amber-400",
  [Prioridad.Baja]: "bg-gray-400",
};

function colorAvance(porcentaje: number) {
  if (porcentaje >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (porcentaje >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function Barra({ porcentaje, color }: { porcentaje: number; color: string }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Avance de evaluación sobre los requisitos vigentes (&quot;Aplica&quot;).
        </p>
      </section>

      <section className="flex items-end gap-4">
        <span className={`text-6xl font-bold ${colorAvance(stats.porcentajeAvance)}`}>
          {stats.porcentajeAvance}%
        </span>
        <span className="text-sm text-black/60 dark:text-white/60 pb-2">
          {stats.cumplen} de {stats.totalAplican} requisitos vigentes cumplen
        </span>
      </section>

      <section>
        <h2 className="section-heading text-lg mb-3">
          Requisitos vigentes por estado de evaluación
        </h2>
        <div className="space-y-2">
          {Object.entries(stats.porEstado).map(([estado, cantidad]) => (
            <div key={estado} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0">{ETIQUETA_ESTADO[estado]}</span>
              <Barra
                porcentaje={stats.totalAplican === 0 ? 0 : (cantidad / stats.totalAplican) * 100}
                color={COLOR_ESTADO[estado]}
              />
              <span className="w-10 text-right tabular-nums">{cantidad}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-heading text-lg mb-3">
          Requisitos vigentes por prioridad
        </h2>
        <div className="space-y-2">
          {Object.entries(stats.porPrioridad).map(([prioridad, cantidad]) => (
            <div key={prioridad} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0">{ETIQUETA_PRIORIDAD[prioridad as Prioridad]}</span>
              <Barra
                porcentaje={stats.totalAplican === 0 ? 0 : (cantidad / stats.totalAplican) * 100}
                color={COLOR_PRIORIDAD[prioridad as Prioridad]}
              />
              <span className="w-10 text-right tabular-nums">{cantidad}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
