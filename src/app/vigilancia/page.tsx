import { listFuentes } from "@/lib/data/fuentes";
import { createFuenteAction, deleteFuenteAction, updateFuenteAction } from "@/lib/actions/fuentes";
import { formatearFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

function fechaInput(fecha: Date | null) {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

export default async function VigilanciaPage() {
  const fuentes = await listFuentes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Vigilancia normativa</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Fuentes a monitorear (BCN, SUSESO, DT, SEC, etc.), con su frecuencia y responsable.
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-teal-700 dark:text-teal-400">Agregar fuente</summary>
        <form action={createFuenteAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Nombre</span>
            <input type="text" name="nombre" required placeholder="BCN, SUSESO, DT, SEC..." className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">URL</span>
            <input type="url" name="url" className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Frecuencia</span>
            <input type="text" name="frecuencia" placeholder="Mensual, Trimestral..." className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Responsable</span>
            <input type="text" name="responsable" className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Última revisión</span>
            <input type="date" name="ultimaRevision" className="field" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-black/60 dark:text-white/60">Notas</span>
            <textarea name="notas" rows={2} className="field" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </details>

      <div className="space-y-3">
        {fuentes.map((fuente) => {
          const actionConId = updateFuenteAction.bind(null, fuente.id);
          const deleteConId = deleteFuenteAction.bind(null, fuente.id);
          return (
            <div key={fuente.id} className="rounded-lg border border-black/10 border-l-4 border-l-teal-600/70 p-3 dark:border-white/10 dark:border-l-teal-400/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{fuente.nombre}</p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    {fuente.frecuencia ?? "Sin frecuencia definida"} · Responsable: {fuente.responsable ?? "—"} ·
                    Última revisión: {formatearFecha(fuente.ultimaRevision)}
                  </p>
                </div>
                <form action={deleteConId}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Eliminar
                  </button>
                </form>
              </div>
              <details className="text-sm mt-2">
                <summary className="cursor-pointer text-black/60 dark:text-white/60">Editar</summary>
                <form action={actionConId} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-black/60 dark:text-white/60">Nombre</span>
                    <input type="text" name="nombre" required defaultValue={fuente.nombre} className="field" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-black/60 dark:text-white/60">URL</span>
                    <input type="url" name="url" defaultValue={fuente.url ?? ""} className="field" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-black/60 dark:text-white/60">Frecuencia</span>
                    <input type="text" name="frecuencia" defaultValue={fuente.frecuencia ?? ""} className="field" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-black/60 dark:text-white/60">Responsable</span>
                    <input type="text" name="responsable" defaultValue={fuente.responsable ?? ""} className="field" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-black/60 dark:text-white/60">Última revisión</span>
                    <input type="date" name="ultimaRevision" defaultValue={fechaInput(fuente.ultimaRevision)} className="field" />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs text-black/60 dark:text-white/60">Notas</span>
                    <textarea name="notas" rows={2} defaultValue={fuente.notas ?? ""} className="field" />
                  </label>
                  <div className="sm:col-span-2">
                    <button type="submit" className="btn-primary">
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </details>
            </div>
          );
        })}
        {fuentes.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Todavía no hay fuentes registradas.</p>
        )}
      </div>
    </div>
  );
}
