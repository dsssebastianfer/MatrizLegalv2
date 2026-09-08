import Link from "next/link";
import { ImpactoCambio } from "@prisma/client";
import { listCambios } from "@/lib/data/cambios";
import { listRequisitosParaSelector } from "@/lib/data/requisitos";
import { createCambioAction } from "@/lib/actions/cambios";
import { Badge } from "@/components/Badge";
import { COLOR_IMPACTO_CAMBIO, DESCRIPCION_CONCEPTO, ETIQUETA_IMPACTO_CAMBIO } from "@/lib/labels";
import { formatearFecha } from "@/lib/format";
import { Tooltip } from "@/components/Tooltip";

export const dynamic = "force-dynamic";

export default async function BitacoraPage() {
  const [cambios, requisitos] = await Promise.all([listCambios(), listRequisitosParaSelector()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Bitácora de cambios normativos</h1>
        <p className="text-sm text-black/60 dark:text-white/60 flex items-center gap-1.5">
          Circulares, leyes modificatorias y pliegos técnicos que actualizan una norma base.
          <Tooltip
            texto={DESCRIPCION_CONCEPTO.criterioBitacora}
            className="cursor-help inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold leading-none text-white shadow-sm dark:bg-teal-500"
          >
            i
          </Tooltip>
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-teal-700 dark:text-teal-400">Registrar nuevo cambio</summary>
        <form action={createCambioAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Requisito base (si corresponde)</span>
            <select name="requisitoBaseId" className="field">
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
            <input type="date" name="fecha" className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Tipo</span>
            <input type="text" name="tipo" placeholder="Circular, Ley modificatoria..." className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Número / código</span>
            <input type="text" name="numeroCodigo" className="field" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-black/60 dark:text-white/60">Nombre</span>
            <input type="text" name="nombre" className="field" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-black/60 dark:text-white/60">Norma o parte que actualiza</span>
            <input type="text" name="normaOParteQueActualiza" className="field" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-black/60 dark:text-white/60">Qué cambió / materia</span>
            <textarea name="queCambio" rows={2} className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Impacto en DSS</span>
            <select name="impacto" required className="field">
              {Object.values(ImpactoCambio).map((i) => (
                <option key={i} value={i}>
                  {ETIQUETA_IMPACTO_CAMBIO[i]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-black/60 dark:text-white/60">Acción / nota</span>
            <textarea name="nota" rows={2} className="field" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </details>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
              <th className="py-1.5 pr-3 font-medium">Fecha</th>
              <th className="py-1.5 pr-3 font-medium">Tipo</th>
              <th className="py-1.5 pr-3 font-medium">Número/código</th>
              <th className="py-1.5 pr-3 font-medium">Nombre</th>
              <th className="py-1.5 pr-3 font-medium">Norma base</th>
              <th className="py-1.5 pr-3 font-medium">Impacto</th>
              <th className="py-1.5 pr-3 font-medium">Nota</th>
              <th className="py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {cambios.map((c) => (
              <tr key={c.id} className="border-b border-black/5 dark:border-white/10 last:border-0 align-top">
                <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(c.fecha)}</td>
                <td className="py-2 pr-3">{c.tipo ?? "—"}</td>
                <td className="py-2 pr-3">{c.numeroCodigo ?? "—"}</td>
                <td className="py-2 pr-3">{c.nombre ?? "—"}</td>
                <td className="py-2 pr-3">
                  {c.requisitoBase ? (
                    <Link href={`/requisitos/${c.requisitoBase.id}`} className="link-accent">
                      {c.requisitoBase.codigoNormativo}
                    </Link>
                  ) : (
                    <span className="text-black/40 dark:text-white/40">—</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Badge className={COLOR_IMPACTO_CAMBIO[c.impacto]}>{ETIQUETA_IMPACTO_CAMBIO[c.impacto]}</Badge>
                </td>
                <td className="py-2 pr-3 max-w-xs">{c.nota ?? "—"}</td>
                <td className="py-2">
                  <Link href={`/bitacora/${c.id}`} className="link-accent">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cambios.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60 py-4">Todavía no hay cambios registrados.</p>
        )}
      </div>
    </div>
  );
}
