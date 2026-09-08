import { Area, EstadoRequisito, NivelVigilancia, Prioridad, RangoJuridico, TipoRelacion } from "@prisma/client";
import {
  ETIQUETA_AREA,
  ETIQUETA_ESTADO_REQUISITO,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_RANGO_JURIDICO,
  ETIQUETA_TIPO_RELACION,
  ETIQUETA_VIGILANCIA,
  DESCRIPCION_CONCEPTO,
} from "@/lib/labels";
import { Tooltip } from "@/components/Tooltip";

interface Bloque {
  id: string;
  nombre: string;
}

interface NormaDisponible {
  id: string;
  legacyId: number | null;
  codigoNormativo: string;
}

export interface ValoresRequisito {
  codigoNormativo?: string;
  nombreOficial?: string;
  bloqueTematicoId?: string;
  estado?: EstadoRequisito;
  aplicabilidad?: string | null;
  rangoJuridico?: RangoJuridico;
  nivelVigilancia?: NivelVigilancia;
  descripcion?: string | null;
  requisitoArticuloClave?: string | null;
  fuenteAVerificar?: string | null;
  comoDemostrarCumplimiento?: string | null;
  frecuenciaRevision?: string | null;
  organismoFiscalizador?: string | null;
  prioridad?: Prioridad;
  normaMadreId?: string | null;
  tipoRelacion?: TipoRelacion;
  areas?: Area[];
}

export function RequisitoForm({
  action,
  bloques,
  normasDisponibles,
  valores = {},
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  bloques: Bloque[];
  normasDisponibles: NormaDisponible[];
  valores?: ValoresRequisito;
  submitLabel: string;
}) {
  const areasSeleccionadas = new Set(valores.areas ?? []);

  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Código normativo</span>
        <input
          type="text"
          name="codigoNormativo"
          required
          defaultValue={valores.codigoNormativo}
          placeholder='ej. D.S. N° 100/2005, MINSEGPRES'
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Nombre oficial</span>
        <input
          type="text"
          name="nombreOficial"
          required
          defaultValue={valores.nombreOficial}
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Bloque temático</span>
        <select name="bloqueTematicoId" required defaultValue={valores.bloqueTematicoId ?? ""} className="field">
          <option value="" disabled>
            Seleccionar…
          </option>
          {bloques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Estado</span>
        <select name="estado" required defaultValue={valores.estado ?? ""} className="field">
          <option value="" disabled>
            Seleccionar…
          </option>
          {Object.values(EstadoRequisito).map((e) => (
            <option key={e} value={e}>
              {ETIQUETA_ESTADO_REQUISITO[e]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">
          <Tooltip texto={DESCRIPCION_CONCEPTO.rangoJuridico}>Rango jurídico</Tooltip>
        </span>
        <select name="rangoJuridico" required defaultValue={valores.rangoJuridico ?? ""} className="field">
          <option value="" disabled>
            Seleccionar…
          </option>
          {Object.values(RangoJuridico).map((r) => (
            <option key={r} value={r}>
              {ETIQUETA_RANGO_JURIDICO[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">
          <Tooltip texto={DESCRIPCION_CONCEPTO.vigilancia}>Nivel de vigilancia</Tooltip>
        </span>
        <select name="nivelVigilancia" required defaultValue={valores.nivelVigilancia ?? ""} className="field">
          <option value="" disabled>
            Seleccionar…
          </option>
          {Object.values(NivelVigilancia).map((v) => (
            <option key={v} value={v}>
              {ETIQUETA_VIGILANCIA[v]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">
          <Tooltip texto={DESCRIPCION_CONCEPTO.prioridad}>Prioridad</Tooltip>
        </span>
        <select name="prioridad" required defaultValue={valores.prioridad ?? ""} className="field">
          <option value="" disabled>
            Seleccionar…
          </option>
          {Object.values(Prioridad).map((p) => (
            <option key={p} value={p}>
              {ETIQUETA_PRIORIDAD[p]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Área(s)</span>
        <div className="flex gap-4">
          {Object.values(Area).map((a) => (
            <label key={a} className="flex items-center gap-1.5">
              <input type="checkbox" name="areas" value={a} defaultChecked={areasSeleccionadas.has(a)} />
              {ETIQUETA_AREA[a]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Norma madre (si depende de otra)</span>
        <select name="normaMadreId" defaultValue={valores.normaMadreId ?? ""} className="field">
          <option value="">Ninguna (norma principal)</option>
          {normasDisponibles.map((n) => (
            <option key={n.id} value={n.id}>
              #{n.legacyId ?? "—"} — {n.codigoNormativo}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">
          <Tooltip texto={DESCRIPCION_CONCEPTO.relacionNormativa}>Tipo de relación</Tooltip>
        </span>
        <select name="tipoRelacion" required defaultValue={valores.tipoRelacion ?? TipoRelacion.Principal} className="field">
          {Object.values(TipoRelacion).map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO_RELACION[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Aplicabilidad (por qué aplica o no)</span>
        <textarea name="aplicabilidad" rows={2} defaultValue={valores.aplicabilidad ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">De qué se trata</span>
        <textarea name="descripcion" rows={3} defaultValue={valores.descripcion ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Requisito o artículo clave (puntero)</span>
        <input type="text" name="requisitoArticuloClave" defaultValue={valores.requisitoArticuloClave ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Fuente a verificar</span>
        <input type="text" name="fuenteAVerificar" defaultValue={valores.fuenteAVerificar ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Cómo demostrar cumplimiento</span>
        <textarea name="comoDemostrarCumplimiento" rows={2} defaultValue={valores.comoDemostrarCumplimiento ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">
          <Tooltip texto={DESCRIPCION_CONCEPTO.frecuenciaRevision}>Frecuencia de revisión</Tooltip>
        </span>
        <input type="text" name="frecuenciaRevision" defaultValue={valores.frecuenciaRevision ?? ""} className="field" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Organismo fiscalizador</span>
        <input type="text" name="organismoFiscalizador" defaultValue={valores.organismoFiscalizador ?? ""} className="field" />
      </label>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
