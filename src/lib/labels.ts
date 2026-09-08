import {
  Area,
  EstadoEvaluacion,
  EstadoRequisito,
  ImpactoCambio,
  NivelVigilancia,
  Prioridad,
  RangoJuridico,
  TipoEventoHistorial,
  TipoRelacion,
} from "@prisma/client";

// Los enums de Prisma usan identificadores válidos en TS (sin espacios/acentos);
// estas etiquetas son el texto real en español que se muestra en la UI.

// Explicaciones de los conceptos del dominio, mostradas como tooltip junto a su
// nombre en la UI (encabezados de tabla, etiquetas de formulario, títulos de sección).
export const DESCRIPCION_CONCEPTO = {
  prioridad:
    "Indica qué tan grave sería incumplir la norma, combinando el riesgo legal, la probabilidad de fiscalización y las consecuencias para las personas o el medioambiente. Opciones: Crítica · Alta · Media · Baja.",
  vigilancia:
    "Indica con qué frecuencia hay que revisar si la norma cambió. Mide el ritmo al que se modifica. Las normas de vigilancia alta cambian seguido, por lo que exigen monitoreo activo en el sitio del organismo que las dicta. Opciones: Alto · Medio · Bajo.",
  rangoJuridico:
    "Indica la fuerza legal de la norma, según quién la dicta. Opciones: Ley (dictada por el Congreso) · Decreto/Reglamento (dictado por el Poder Ejecutivo) · Norma administrativa (dictada por un organismo fiscalizador: circulares, resoluciones, normas técnicas, ordenanzas, pliegos).",
  frecuenciaRevision:
    "Indica cada cuánto tiempo se debe volver a evaluar el cumplimiento de esta norma en la organización. Opciones sugeridas: Mensual · Trimestral · Semestral · Anual · Por evento.",
  relacionNormativa:
    "Indica cómo se vincula una norma con otra. Permite agrupar una norma con su norma madre en lugar de tratarla como un requisito suelto. Opciones: Principal (norma base, no depende de otra) · Modifica (cambia el texto de otra norma) · Reglamenta (desarrolla una ley) · Complementa (apoya a otra sin modificarla) · Libro / Sub-parte (es una parte interna de una norma mayor) · Reemplazada por (fue sustituida por una norma posterior) · Transición (convive con una norma nueva mientras esta entra plenamente en vigencia).",
  cambiosNormativosVinculados:
    "Registro de las actualizaciones que recibe la norma base a lo largo del tiempo: circulares, leyes modificatorias, pliegos técnicos u otras.",
  criterioBitacora:
    "Un cambio queda aquí (y no como norma propia en la Matriz) cuando modifica una norma que ya está en la Matriz pero no crea una obligación que necesite evidencia o seguimiento propio — por ejemplo, un ajuste puntual a un artículo, absorbido al evaluar la norma base. Si en cambio trae un régimen de cumplimiento nuevo (su propio procedimiento, evidencia o revisión periódica), pasa a tener su propia fila en la Matriz, enlazada a su norma madre.",
  criterioAplicabilidad:
    "Criterio para la identificación de artículos aplicables\n\n" +
    "La evaluación de cada norma se concentra en los artículos o componentes que establecen obligaciones concretas para la organización. Las disposiciones que no generan requisitos exigibles se consideran únicamente como antecedentes o contexto normativo.\n\n" +
    "Se consideran clave aquellas disposiciones relacionadas directa o indirectamente con:\n" +
    "• las actividades desarrolladas por la organización;\n" +
    "• las instalaciones, equipos o bienes utilizados;\n" +
    "• las características de la organización, tales como dotación, rubro y ubicación;\n" +
    "• las relaciones mantenidas con trabajadores, mandantes, contratistas, autoridades y demás partes interesadas.\n" +
    "• Los Riesgos identificados en la Matriz de Riesgos\n" +
    "• Aspectos Ambientales identificados en Matriz de Aspectos Ambientales\n\n" +
    "La identificación de artículos y componentes clave de una norma constituye una orientación para la evaluación del cumplimiento y no reemplaza la revisión del texto oficial vigente de la norma.",
} as const;

export const ETIQUETA_ESTADO_REQUISITO: Record<EstadoRequisito, string> = {
  [EstadoRequisito.Aplica]: "Aplica",
  [EstadoRequisito.NoAplica]: "No aplica",
  [EstadoRequisito.Derogada]: "Derogada",
  [EstadoRequisito.EvaluarAplicabilidad]: "Evaluar aplicabilidad",
};

export const ETIQUETA_RANGO_JURIDICO: Record<RangoJuridico, string> = {
  [RangoJuridico.Ley]: "Ley",
  [RangoJuridico.DecretoReglamento]: "Decreto/Reglamento",
  [RangoJuridico.NormaAdministrativa]: "Norma administrativa",
};

export const ETIQUETA_VIGILANCIA: Record<NivelVigilancia, string> = {
  [NivelVigilancia.Alto]: "Alto",
  [NivelVigilancia.Medio]: "Medio",
  [NivelVigilancia.Bajo]: "Bajo",
};

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  [Prioridad.Critica]: "Crítica",
  [Prioridad.Alta]: "Alta",
  [Prioridad.Media]: "Media",
  [Prioridad.Baja]: "Baja",
};

export const ETIQUETA_TIPO_RELACION: Record<TipoRelacion, string> = {
  [TipoRelacion.Principal]: "Principal",
  [TipoRelacion.Modifica]: "Modifica",
  [TipoRelacion.Reglamenta]: "Reglamenta",
  [TipoRelacion.Complementa]: "Complementa",
  [TipoRelacion.Libro]: "Libro",
  [TipoRelacion.SubParte]: "Sub-parte",
  [TipoRelacion.ReemplazadaPor]: "Reemplazada por",
  [TipoRelacion.Transicion]: "Transición",
};

export const ETIQUETA_AREA: Record<Area, string> = {
  [Area.Calidad]: "Calidad",
  [Area.Ambiente]: "Ambiente",
  [Area.SST]: "SST",
};

export const ETIQUETA_ESTADO_EVALUACION: Record<EstadoEvaluacion, string> = {
  [EstadoEvaluacion.Cumple]: "Cumple",
  [EstadoEvaluacion.CumpleParcialmente]: "Cumple parcialmente",
  [EstadoEvaluacion.NoCumple]: "No cumple",
  [EstadoEvaluacion.NoAplica]: "No aplica",
  [EstadoEvaluacion.PorEvaluar]: "Por evaluar",
};

export const ETIQUETA_IMPACTO_CAMBIO: Record<ImpactoCambio, string> = {
  [ImpactoCambio.Si]: "Sí",
  [ImpactoCambio.NoAplica]: "No aplica",
  [ImpactoCambio.AplicacionCondicionada]: "Aplicación condicionada",
  [ImpactoCambio.AplicacionIndirecta]: "Aplicación indirecta",
};

export const COLOR_IMPACTO_CAMBIO: Record<ImpactoCambio, string> = {
  [ImpactoCambio.Si]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  [ImpactoCambio.NoAplica]: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  [ImpactoCambio.AplicacionCondicionada]: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  [ImpactoCambio.AplicacionIndirecta]: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

export const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  [Prioridad.Critica]: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  [Prioridad.Alta]: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  [Prioridad.Media]: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  [Prioridad.Baja]: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

export const COLOR_ESTADO_REQUISITO: Record<EstadoRequisito, string> = {
  [EstadoRequisito.Aplica]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  [EstadoRequisito.NoAplica]: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  [EstadoRequisito.Derogada]: "bg-gray-200 text-gray-600 dark:bg-gray-500/30 dark:text-gray-400",
  [EstadoRequisito.EvaluarAplicabilidad]: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

export const COLOR_ESTADO_EVALUACION: Record<EstadoEvaluacion, string> = {
  [EstadoEvaluacion.Cumple]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  [EstadoEvaluacion.CumpleParcialmente]: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  [EstadoEvaluacion.NoCumple]: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  [EstadoEvaluacion.NoAplica]: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  [EstadoEvaluacion.PorEvaluar]: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

export const ETIQUETA_TIPO_EVENTO_HISTORIAL: Record<TipoEventoHistorial, string> = {
  [TipoEventoHistorial.CreacionRequisito]: "Norma creada",
  [TipoEventoHistorial.EdicionRequisito]: "Norma editada",
  [TipoEventoHistorial.RegistroEvaluacion]: "Revisión registrada",
};

export const COLOR_TIPO_EVENTO_HISTORIAL: Record<TipoEventoHistorial, string> = {
  [TipoEventoHistorial.CreacionRequisito]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  [TipoEventoHistorial.EdicionRequisito]: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  [TipoEventoHistorial.RegistroEvaluacion]: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
};

// Traduce el nombre técnico de cada campo editable de un Requisito al texto
// que ve el usuario, para armar descripciones legibles de ediciones en el
// historial de cambios (ver src/lib/historial.ts).
export const ETIQUETA_CAMPO_REQUISITO: Record<string, string> = {
  codigoNormativo: "Código normativo",
  nombreOficial: "Nombre oficial",
  bloqueTematicoId: "Bloque temático",
  estado: "Estado",
  aplicabilidad: "Aplicabilidad",
  rangoJuridico: "Rango jurídico",
  nivelVigilancia: "Nivel de vigilancia",
  descripcion: "De qué se trata",
  requisitoArticuloClave: "Requisito o artículo clave",
  fuenteAVerificar: "Fuente a verificar",
  comoDemostrarCumplimiento: "Cómo demostrar cumplimiento",
  frecuenciaRevision: "Frecuencia de revisión",
  organismoFiscalizador: "Organismo fiscalizador",
  prioridad: "Prioridad",
  normaMadreId: "Norma madre",
  tipoRelacion: "Tipo de relación",
  areas: "Áreas",
};
