import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoEvaluacion, RangoJuridico } from "@prisma/client";
import { flattenIndice, getIndiceNormas, getRequisitoDetalle, listBloquesTematicos } from "@/lib/data/requisitos";
import { listUsuariosActivos } from "@/lib/data/usuarios";
import { listHistorial } from "@/lib/data/historial";
import { registrarEvaluacionAction } from "@/lib/actions/evaluaciones";
import {
  updateDatosGeneralesAction,
  updateContenidoAplicabilidadAction,
  restaurarRequisitoAction,
} from "@/lib/actions/requisitos";
import { Badge } from "@/components/Badge";
import { Tooltip } from "@/components/Tooltip";
import { IndiceNormas } from "@/components/IndiceNormas";
import { EditableSection } from "@/components/EditableSection";
import { formatearFecha, formatearFechaHora } from "@/lib/format";
import {
  ETIQUETA_AREA,
  ETIQUETA_ESTADO_EVALUACION,
  ETIQUETA_ESTADO_REQUISITO,
  ETIQUETA_IMPACTO_CAMBIO,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_RANGO_JURIDICO,
  ETIQUETA_TIPO_RELACION,
  ETIQUETA_TIPO_EVENTO_HISTORIAL,
  ETIQUETA_VIGILANCIA,
  COLOR_ESTADO_EVALUACION,
  COLOR_ESTADO_REQUISITO,
  COLOR_IMPACTO_CAMBIO,
  COLOR_PRIORIDAD,
  COLOR_TIPO_EVENTO_HISTORIAL,
  DESCRIPCION_CONCEPTO,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

function Campo({
  etiqueta,
  descripcion,
  children,
}: {
  etiqueta: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-xs text-black/60 dark:text-white/60">
        {descripcion ? <Tooltip texto={descripcion}>{etiqueta}</Tooltip> : etiqueta}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function RequisitoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [requisito, usuarios, indiceNormas, bloques, historial] = await Promise.all([
    getRequisitoDetalle(id),
    listUsuariosActivos(),
    getIndiceNormas(),
    listBloquesTematicos(),
    listHistorial({ requisitoId: id }),
  ]);

  if (!requisito) notFound();

  const orden = flattenIndice(indiceNormas);
  const posicion = orden.findIndex((item) => item.id === id);
  const anterior = posicion > 0 ? orden[posicion - 1] : null;
  const siguiente = posicion !== -1 && posicion < orden.length - 1 ? orden[posicion + 1] : null;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between gap-2">
          <Link href="/matriz" className="text-sm link-accent">
            ← Volver a la Matriz
          </Link>
          <div className="flex items-center gap-2">
            {anterior ? (
              <Link
                href={`/requisitos/${anterior.id}`}
                title={`Anterior: ${anterior.codigoNormativo}`}
                className="btn-secondary text-sm"
              >
                ↑ Anterior
              </Link>
            ) : (
              <span className="btn-secondary text-sm cursor-not-allowed opacity-40">↑ Anterior</span>
            )}
            {siguiente ? (
              <Link
                href={`/requisitos/${siguiente.id}`}
                title={`Siguiente: ${siguiente.codigoNormativo}`}
                className="btn-secondary text-sm"
              >
                ↓ Siguiente
              </Link>
            ) : (
              <span className="btn-secondary text-sm cursor-not-allowed opacity-40">↓ Siguiente</span>
            )}
            <Link href={`/requisitos/${requisito.id}/editar`} className="btn-secondary text-sm">
              Editar
            </Link>
            <IndiceNormas bloques={indiceNormas} />
          </div>
        </div>

        {requisito.eliminadoEn && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm dark:border-red-900/50 dark:bg-red-950/30">
            <span className="text-red-800 dark:text-red-300">
              Esta norma fue eliminada el {formatearFecha(requisito.eliminadoEn)}. No aparece en la Matriz ni en los
              selectores.
            </span>
            <form action={restaurarRequisitoAction.bind(null, requisito.id)}>
              <button type="submit" className="btn-secondary text-sm whitespace-nowrap">
                Restaurar
              </button>
            </form>
          </div>
        )}

        <h1 className="text-2xl font-semibold mt-2">
          {requisito.legacyId && (
            <span className="text-black/40 dark:text-white/40 mr-2">#{requisito.legacyId}</span>
          )}
          {requisito.codigoNormativo}
        </h1>
        <p className="text-black/80 dark:text-white/80">{requisito.nombreOficial}</p>
        <div className="flex gap-2 mt-3">
          <Tooltip texto={requisito.aplicabilidad}>
            <Badge className={COLOR_ESTADO_REQUISITO[requisito.estado]}>
              {ETIQUETA_ESTADO_REQUISITO[requisito.estado]}
            </Badge>
          </Tooltip>
          <Tooltip texto={DESCRIPCION_CONCEPTO.prioridad}>
            <Badge className={COLOR_PRIORIDAD[requisito.prioridad]}>
              {ETIQUETA_PRIORIDAD[requisito.prioridad]}
            </Badge>
          </Tooltip>
          <Tooltip texto={DESCRIPCION_CONCEPTO.vigilancia}>
            <Badge className="bg-black/5 dark:bg-white/10">
              Vigilancia {ETIQUETA_VIGILANCIA[requisito.nivelVigilancia]}
            </Badge>
          </Tooltip>
          {requisito.areas.map(({ area }) => (
            <Badge key={area} className="bg-black/5 dark:bg-white/10">
              {ETIQUETA_AREA[area]}
            </Badge>
          ))}
        </div>
      </div>

      <section>
        <h2 className="section-heading text-lg mb-3">Datos generales</h2>
        <EditableSection
          contenido={
            <>
              <div>
                <dt className="text-xs text-black/60 dark:text-white/60 mb-1">Bloque temático</dt>
                <Badge className="bg-teal-600/10 text-teal-800 text-sm px-3 py-1 dark:bg-teal-400/10 dark:text-teal-300">
                  {requisito.bloqueTematico.nombre}
                </Badge>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo etiqueta="Rango jurídico" descripcion={DESCRIPCION_CONCEPTO.rangoJuridico}>
                  {ETIQUETA_RANGO_JURIDICO[requisito.rangoJuridico]}
                </Campo>
                <Campo etiqueta="Frecuencia de revisión" descripcion={DESCRIPCION_CONCEPTO.frecuenciaRevision}>
                  {requisito.frecuenciaRevision}
                </Campo>
                <Campo etiqueta="Fuente a verificar">
                  {requisito.fuenteAVerificar?.startsWith("http") ? (
                    <a
                      href={requisito.fuenteAVerificar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-accent"
                    >
                      {requisito.fuenteAVerificar}
                    </a>
                  ) : (
                    requisito.fuenteAVerificar
                  )}
                </Campo>
                <Campo etiqueta="Organismo fiscalizador">{requisito.organismoFiscalizador}</Campo>
              </dl>
            </>
          }
          formulario={
            <form action={updateDatosGeneralesAction.bind(null, requisito.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Bloque temático</span>
                <select name="bloqueTematicoId" required defaultValue={requisito.bloqueTematicoId} className="field">
                  {bloques.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Rango jurídico</span>
                <select name="rangoJuridico" required defaultValue={requisito.rangoJuridico} className="field">
                  {Object.values(RangoJuridico).map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETA_RANGO_JURIDICO[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Frecuencia de revisión</span>
                <input
                  type="text"
                  name="frecuenciaRevision"
                  defaultValue={requisito.frecuenciaRevision ?? ""}
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Organismo fiscalizador</span>
                <input
                  type="text"
                  name="organismoFiscalizador"
                  defaultValue={requisito.organismoFiscalizador ?? ""}
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-black/60 dark:text-white/60">Fuente a verificar</span>
                <input
                  type="text"
                  name="fuenteAVerificar"
                  defaultValue={requisito.fuenteAVerificar ?? ""}
                  className="field"
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          }
        />
      </section>

      <section>
        <h2 className="section-heading text-lg mb-3 flex items-center gap-1.5">
          Contenido y aplicabilidad
          <Tooltip
            texto={DESCRIPCION_CONCEPTO.criterioAplicabilidad}
            className="cursor-help inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold leading-none text-white shadow-sm dark:bg-teal-500"
          >
            i
          </Tooltip>
        </h2>
        <EditableSection
          contenido={
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo etiqueta="De qué se trata">{requisito.descripcion}</Campo>
              <Campo etiqueta="Aplicabilidad (por qué aplica o no)">{requisito.aplicabilidad}</Campo>
              <Campo etiqueta="Requisito o artículo clave">{requisito.requisitoArticuloClave}</Campo>
              <Campo etiqueta="Cómo demostrar cumplimiento">{requisito.comoDemostrarCumplimiento}</Campo>
            </dl>
          }
          formulario={
            <form
              action={updateContenidoAplicabilidadAction.bind(null, requisito.id)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"
            >
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-black/60 dark:text-white/60">De qué se trata</span>
                <textarea name="descripcion" rows={3} defaultValue={requisito.descripcion ?? ""} className="field" />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-black/60 dark:text-white/60">Aplicabilidad (por qué aplica o no)</span>
                <textarea name="aplicabilidad" rows={2} defaultValue={requisito.aplicabilidad ?? ""} className="field" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Requisito o artículo clave</span>
                <input
                  type="text"
                  name="requisitoArticuloClave"
                  defaultValue={requisito.requisitoArticuloClave ?? ""}
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Cómo demostrar cumplimiento</span>
                <textarea
                  name="comoDemostrarCumplimiento"
                  rows={2}
                  defaultValue={requisito.comoDemostrarCumplimiento ?? ""}
                  className="field"
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          }
        />
      </section>

      {(requisito.normaMadre || requisito.normasHijas.length > 0) && (
        <section>
          <h2 className="section-heading text-lg mb-3">
            <Tooltip texto={DESCRIPCION_CONCEPTO.relacionNormativa}>Relación normativa</Tooltip>
          </h2>
          {requisito.normaMadre && (
            <p className="text-sm mb-2">
              {ETIQUETA_TIPO_RELACION[requisito.tipoRelacion]} de{" "}
              <Link href={`/requisitos/${requisito.normaMadre.id}`} className="link-accent font-medium">
                {requisito.normaMadre.codigoNormativo}
              </Link>
            </p>
          )}
          {requisito.normasHijas.length > 0 && (
            <ul className="text-sm space-y-1">
              {requisito.normasHijas.map((hija) => (
                <li key={hija.id}>
                  <Link href={`/requisitos/${hija.id}`} className="link-accent font-medium">
                    {hija.codigoNormativo}
                  </Link>{" "}
                  <span className="text-black/60 dark:text-white/60">
                    ({ETIQUETA_TIPO_RELACION[hija.tipoRelacion]})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="section-heading text-lg mb-3">Evaluación de Cumplimiento</h2>
        <div className="rounded-lg border-2 border-teal-600/50 bg-teal-600/5 p-4 dark:border-teal-400/40 dark:bg-teal-400/5">
          {requisito.evaluaciones.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">Todavía no se ha registrado ninguna evaluación.</p>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
                    <th className="py-1.5 pr-3 font-medium">Fecha</th>
                    <th className="py-1.5 pr-3 font-medium">Estado</th>
                    <th className="py-1.5 pr-3 font-medium">Evidencia</th>
                    <th className="py-1.5 pr-3 font-medium">Responsable</th>
                    <th className="py-1.5 pr-3 font-medium">Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {requisito.evaluaciones.map((ev) => (
                    <tr key={ev.id} className="border-b border-black/5 dark:border-white/10 last:border-0 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(ev.fecha)}</td>
                      <td className="py-2 pr-3">
                        <Badge className={COLOR_ESTADO_EVALUACION[ev.estado]}>
                          {ETIQUETA_ESTADO_EVALUACION[ev.estado]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{ev.evidencia ?? "—"}</td>
                      <td className="py-2 pr-3">{ev.responsable ?? "—"}</td>
                      <td className="py-2 pr-3">{ev.usuario.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Registrar nueva evaluación</summary>
            <form action={registrarEvaluacionAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
              <input type="hidden" name="requisitoId" value={requisito.id} />
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Estado</span>
                <select name="estado" required className="field">
                  {Object.values(EstadoEvaluacion).map((e) => (
                    <option key={e} value={e}>
                      {ETIQUETA_ESTADO_EVALUACION[e]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Fecha</span>
                <input
                  type="date"
                  name="fecha"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Responsable</span>
                <input type="text" name="responsable" className="field" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Registrado por</span>
                <select name="usuarioId" required className="field">
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-black/60 dark:text-white/60">Evidencia</span>
                <textarea name="evidencia" rows={3} className="field" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Guardar evaluación
                </button>
              </div>
            </form>
          </details>
        </div>
      </section>

      <section>
        <h2 className="section-heading text-lg mb-3">
          <Tooltip texto={DESCRIPCION_CONCEPTO.cambiosNormativosVinculados}>
            Cambios normativos vinculados
          </Tooltip>
        </h2>
        {requisito.cambios.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Sin cambios registrados en la bitácora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
                  <th className="py-1.5 pr-3 font-medium">Fecha</th>
                  <th className="py-1.5 pr-3 font-medium">Tipo</th>
                  <th className="py-1.5 pr-3 font-medium">Número/código</th>
                  <th className="py-1.5 pr-3 font-medium">Nombre</th>
                  <th className="py-1.5 pr-3 font-medium">Qué cambió</th>
                  <th className="py-1.5 pr-3 font-medium">Impacto</th>
                  <th className="py-1.5 pr-3 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {requisito.cambios.map((c) => (
                  <tr key={c.id} className="border-b border-black/5 dark:border-white/10 last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(c.fecha)}</td>
                    <td className="py-2 pr-3">{c.tipo ?? "—"}</td>
                    <td className="py-2 pr-3">{c.numeroCodigo ?? "—"}</td>
                    <td className="py-2 pr-3">{c.nombre ?? "—"}</td>
                    <td className="py-2 pr-3">{c.queCambio ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <Badge className={COLOR_IMPACTO_CAMBIO[c.impacto]}>{ETIQUETA_IMPACTO_CAMBIO[c.impacto]}</Badge>
                    </td>
                    <td className="py-2 pr-3">{c.nota ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-heading text-lg mb-3">Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Todavía no hay cambios registrados para esta norma.</p>
        ) : (
          <div className="space-y-2">
            {historial.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className={`${COLOR_TIPO_EVENTO_HISTORIAL[ev.tipo]} mb-1`}>
                      {ETIQUETA_TIPO_EVENTO_HISTORIAL[ev.tipo]}
                    </Badge>
                    <p>{ev.resumen}</p>
                  </div>
                  <div className="text-right text-xs text-black/50 dark:text-white/50 whitespace-nowrap">
                    <div>{formatearFechaHora(ev.createdAt)}</div>
                    <div>{ev.usuarioNombre}</div>
                  </div>
                </div>
                {ev.cambios && ev.cambios.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-teal-700 dark:text-teal-400 text-xs">
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
          </div>
        )}
      </section>
    </div>
  );
}
