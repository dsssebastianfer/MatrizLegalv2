import { notFound } from "next/navigation";
import Link from "next/link";
import { ImpactoCambio } from "@prisma/client";
import { getCambio } from "@/lib/data/cambios";
import { listRequisitosParaSelector } from "@/lib/data/requisitos";
import { updateCambioAction } from "@/lib/actions/cambios";
import { ETIQUETA_IMPACTO_CAMBIO } from "@/lib/labels";

export const dynamic = "force-dynamic";

function fechaInput(fecha: Date | null) {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

export default async function EditarCambioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cambio, requisitos] = await Promise.all([getCambio(id), listRequisitosParaSelector()]);

  if (!cambio) notFound();

  const actionConId = updateCambioAction.bind(null, id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/bitacora" className="text-sm link-accent">
          ← Volver a la Bitácora
        </Link>
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
    </div>
  );
}
