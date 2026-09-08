import { Area, EstadoEvaluacion, TipoEventoHistorial, type Requisito } from "@prisma/client";
import {
  ETIQUETA_AREA,
  ETIQUETA_CAMPO_REQUISITO,
  ETIQUETA_ESTADO_EVALUACION,
  ETIQUETA_ESTADO_REQUISITO,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_RANGO_JURIDICO,
  ETIQUETA_TIPO_RELACION,
  ETIQUETA_VIGILANCIA,
} from "@/lib/labels";
import { getCodigoNormativoRequisito, getNombreBloqueTematico } from "@/lib/data/requisitos";
import { crearHistorial, type CambioCampo } from "@/lib/data/historial";

const VACIO = "(vacío)";

async function formatearValor(campo: string, valor: unknown): Promise<string> {
  if (valor === null || valor === undefined || valor === "") return VACIO;
  switch (campo) {
    case "estado":
      return ETIQUETA_ESTADO_REQUISITO[valor as keyof typeof ETIQUETA_ESTADO_REQUISITO];
    case "rangoJuridico":
      return ETIQUETA_RANGO_JURIDICO[valor as keyof typeof ETIQUETA_RANGO_JURIDICO];
    case "nivelVigilancia":
      return ETIQUETA_VIGILANCIA[valor as keyof typeof ETIQUETA_VIGILANCIA];
    case "prioridad":
      return ETIQUETA_PRIORIDAD[valor as keyof typeof ETIQUETA_PRIORIDAD];
    case "tipoRelacion":
      return ETIQUETA_TIPO_RELACION[valor as keyof typeof ETIQUETA_TIPO_RELACION];
    case "bloqueTematicoId":
      return (await getNombreBloqueTematico(valor as string)) ?? (valor as string);
    case "normaMadreId":
      return (await getCodigoNormativoRequisito(valor as string)) ?? (valor as string);
    default:
      return String(valor);
  }
}

const CAMPOS_REQUISITO = [
  "codigoNormativo",
  "nombreOficial",
  "bloqueTematicoId",
  "estado",
  "aplicabilidad",
  "rangoJuridico",
  "nivelVigilancia",
  "descripcion",
  "requisitoArticuloClave",
  "fuenteAVerificar",
  "comoDemostrarCumplimiento",
  "frecuenciaRevision",
  "organismoFiscalizador",
  "prioridad",
  "normaMadreId",
  "tipoRelacion",
] as const;

async function calcularCambiosCampos(
  antes: Requisito,
  despues: Requisito,
  campos: readonly string[],
): Promise<CambioCampo[]> {
  const cambios: CambioCampo[] = [];
  for (const campo of campos) {
    const valorAntes = (antes as unknown as Record<string, unknown>)[campo];
    const valorDespues = (despues as unknown as Record<string, unknown>)[campo];
    if ((valorAntes ?? null) === (valorDespues ?? null)) continue;
    cambios.push({
      campo,
      etiqueta: ETIQUETA_CAMPO_REQUISITO[campo] ?? campo,
      antes: await formatearValor(campo, valorAntes),
      despues: await formatearValor(campo, valorDespues),
    });
  }
  return cambios;
}

function calcularCambioAreas(antes: Area[], despues: Area[]): CambioCampo | null {
  const setDespues = new Set(despues);
  const igual = antes.length === despues.length && antes.every((a) => setDespues.has(a));
  if (igual) return null;
  const etiquetar = (areas: Area[]) => (areas.length > 0 ? areas.map((a) => ETIQUETA_AREA[a]).join(", ") : VACIO);
  return {
    campo: "areas",
    etiqueta: ETIQUETA_CAMPO_REQUISITO.areas,
    antes: etiquetar(antes),
    despues: etiquetar(despues),
  };
}

export async function registrarCreacionRequisito(requisito: Requisito, usuarioNombre: string) {
  await crearHistorial({
    tipo: TipoEventoHistorial.CreacionRequisito,
    requisitoId: requisito.id,
    codigoNormativo: requisito.codigoNormativo,
    usuarioNombre,
    resumen: `Creó la norma «${requisito.codigoNormativo}» (${requisito.nombreOficial}).`,
  });
}

export async function registrarEdicionRequisito(
  antes: Requisito,
  despues: Requisito,
  usuarioNombre: string,
  opts?: { areasAntes?: Area[]; areasDespues?: Area[]; campos?: readonly string[] },
) {
  const campos = opts?.campos ?? CAMPOS_REQUISITO;
  const cambios = await calcularCambiosCampos(antes, despues, campos);

  if (opts?.areasAntes && opts?.areasDespues) {
    const cambioAreas = calcularCambioAreas(opts.areasAntes, opts.areasDespues);
    if (cambioAreas) cambios.push(cambioAreas);
  }

  // No dejar un rastro vacío si el formulario se guardó sin cambiar nada.
  if (cambios.length === 0) return;

  const listaEtiquetas = cambios.map((c) => `«${c.etiqueta}»`).join(", ");
  await crearHistorial({
    tipo: TipoEventoHistorial.EdicionRequisito,
    requisitoId: despues.id,
    codigoNormativo: despues.codigoNormativo,
    usuarioNombre,
    resumen: `Editó ${listaEtiquetas} de la norma «${despues.codigoNormativo}».`,
    cambios,
  });
}

export async function registrarEvaluacionHistorial(
  requisito: { id: string; codigoNormativo: string },
  estado: EstadoEvaluacion,
  usuarioNombre: string,
) {
  await crearHistorial({
    tipo: TipoEventoHistorial.RegistroEvaluacion,
    requisitoId: requisito.id,
    codigoNormativo: requisito.codigoNormativo,
    usuarioNombre,
    resumen: `Registró una revisión de la norma «${requisito.codigoNormativo}»: ${ETIQUETA_ESTADO_EVALUACION[estado]}.`,
  });
}

export async function registrarEliminacionRequisito(
  requisito: Requisito,
  justificacion: string,
  usuarioNombre: string,
) {
  await crearHistorial({
    tipo: TipoEventoHistorial.EliminacionRequisito,
    requisitoId: requisito.id,
    codigoNormativo: requisito.codigoNormativo,
    usuarioNombre,
    resumen: `Eliminó la norma «${requisito.codigoNormativo}» (${requisito.nombreOficial}). Justificación: ${justificacion}`,
  });
}

export async function registrarRestauracionRequisito(requisito: Requisito, usuarioNombre: string) {
  await crearHistorial({
    tipo: TipoEventoHistorial.RestauracionRequisito,
    requisitoId: requisito.id,
    codigoNormativo: requisito.codigoNormativo,
    usuarioNombre,
    resumen: `Restauró la norma «${requisito.codigoNormativo}» (previamente eliminada).`,
  });
}
