import Link from "next/link";
import { listHistorial } from "@/lib/data/historial";
import { Badge } from "@/components/Badge";
import { formatearFechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_EVENTO_HISTORIAL, COLOR_TIPO_EVENTO_HISTORIAL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const eventos = await listHistorial({ limit: 300 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Historial de cambios</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Quién hizo qué: creación de normas, ediciones (con el valor anterior y el nuevo de cada campo) y revisiones
          registradas.
        </p>
      </div>

      <div className="space-y-3">
        {eventos.map((ev) => (
          <div key={ev.id} className="rounded-lg border border-black/10 dark:border-white/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <Badge className={COLOR_TIPO_EVENTO_HISTORIAL[ev.tipo]}>
                    {ETIQUETA_TIPO_EVENTO_HISTORIAL[ev.tipo]}
                  </Badge>
                  {ev.requisitoId && ev.codigoNormativo && (
                    <Link href={`/requisitos/${ev.requisitoId}`} className="link-accent text-sm font-medium">
                      {ev.codigoNormativo}
                    </Link>
                  )}
                </div>
                <p className="text-sm">{ev.resumen}</p>
              </div>
              <div className="text-right text-xs text-black/50 dark:text-white/50 whitespace-nowrap">
                <div>{formatearFechaHora(ev.createdAt)}</div>
                <div>{ev.usuarioNombre}</div>
              </div>
            </div>

            {ev.cambios && ev.cambios.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-teal-700 dark:text-teal-400">
                  Ver detalle de los cambios
                </summary>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="text-left text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
                        <th className="py-1 pr-3 font-medium">Campo</th>
                        <th className="py-1 pr-3 font-medium">Antes</th>
                        <th className="py-1 font-medium">Ahora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ev.cambios.map((c) => (
                        <tr key={c.campo} className="border-b border-black/5 dark:border-white/10 last:border-0 align-top">
                          <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{c.etiqueta}</td>
                          <td className="py-1.5 pr-3 text-black/70 dark:text-white/70">{c.antes}</td>
                          <td className="py-1.5">{c.despues}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        ))}
        {eventos.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">Todavía no hay cambios registrados.</p>
        )}
      </div>
    </div>
  );
}
