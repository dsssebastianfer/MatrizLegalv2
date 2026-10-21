import { notFound } from "next/navigation";
import Link from "next/link";
import { ImpactoCambio } from "@prisma/client";
import { getCambio } from "@/lib/data/cambios";
import { listRequisitosParaSelector } from "@/lib/data/requisitos";
import { eliminarCambioAction, restaurarCambioAction, updateCambioAction } from "@/lib/actions/cambios";
import { ETIQUETA_IMPACTO_CAMBIO } from "@/lib/labels";
import { formatearFecha } from "@/lib/format";
import { BotonConfirmar } from "@/components/BotonConfirmar";

export const dynamic = "force-dynamic";

function fechaInput(fecha: Date | null) {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

export default async function EditarCambioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cambio, requisitos] = await Promise.all([getCambio(id), listRequisitosParaSelector()]);

  if (!cambio) notFound();

  const actionConId = updateCambioAction.bind(null, id);
  const eliminarConId = eliminarCambioAction.bind(null, id);
  const identificador = cambio.numeroCodigo || cambio.nombre || "este registro";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/bitacora" className="text-sm link-accent">
          ← Volver a la Bitácora
        </Link>
        {cambio.eliminadoEn && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm dark:border-red-900/50 dark:bg-red-950/30">
            <span className="text-red-800 dark:text-red-300">
              Este registro fue eliminado el {formatearFecha(cambio.eliminadoEn)}. No aparece en la Bitácora ni en la
              ficha de la norma.
            </span>
            <form action={restaurarCambioAction.bind(null, id)}>
              <button type="submit" className="btn-secondary text-sm whitespace-nowrap">
                Restaurar
              </button>
            </form>
          </div>
        )}
        <h1 className="text-2xl font-semibold mt-2">Editar cambio normativo</h1>
        {cambio.requisitoBase && (
          <p className="text-sm text-black/60 dark:text-white/60">
            Sobre {cambio.requisitoBase.codigoNormativo} — {cambio.requisitoBase.nombreOficial}
          </p>
        )}
      </div>

      <form action={actionConId} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Requisito base (si corresponde)</span>
          <select name="requisitoBaseId" defaultValue={cambio.requisitoBaseId ?? ""} className="field">
            <option value="">Ninguno (no modifica una norma de la Matriz)</option>
            {requisitos.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.legacyId ?? "—"} — {r.codigoNormativo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Fecha (si se conoce)</span>
          <input type="date" name="fecha" defaultValue={fechaInput(cambio.fecha)} className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Tipo</span>
          <input type="text" name="tipo" defaultValue={cambio.tipo ?? ""} className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Número / código</span>
          <input type="text" name="numeroCodigo" defaultValue={cambio.numeroCodigo ?? ""} className="field" />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-black/60 dark:text-white/60">Nombre</span>
          <input type="text" name="nombre" defaultValue={cambio.nombre ?? ""} className="field" />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-black/60 dark:text-white/60">Norma o parte que actualiza</span>
          <input
            type="text"
            name="normaOParteQueActualiza"
            defaultValue={cambio.normaOParteQueActualiza ?? ""}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-black/60 dark:text-white/60">Qué cambió / materia</span>
          <textarea name="queCambio" rows={2} defaultValue={cambio.queCambio ?? ""} className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Impacto en DSS</span>
          <select name="impacto" required defaultValue={cambio.impacto} className="field">
            {Object.values(ImpactoCambio).map((i) => (
              <option key={i} value={i}>
                {ETIQUETA_IMPACTO_CAMBIO[i]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-black/60 dark:text-white/60">Acción / nota</span>
          <textarea name="nota" rows={2} defaultValue={cambio.nota ?? ""} className="field" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>

      {!cambio.eliminadoEn && (
        <details className="rounded-lg border border-red-300 dark:border-red-900/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
            Eliminar este registro
          </summary>
          <div className="px-4 pb-4">
            <p className="text-sm text-black/60 dark:text-white/60 mb-3">
              El registro deja de aparecer en la Bitácora y en la ficha de la norma, pero se conserva y queda en el
              Historial de cambios. Se puede restaurar después desde el Historial.
            </p>
            <form action={eliminarConId} className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Justificación de la eliminación</span>
                <textarea name="justificacion" required rows={3} className="field" />
              </label>
              <BotonConfirmar
                mensaje={`¿Eliminar «${identificador}» de la bitácora? Se puede restaurar después.`}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar registro
              </BotonConfirmar>
            </form>
          </div>
        </details>
      )}
    </div>
  );
}
