"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Area, EstadoRequisito, NivelVigilancia, Prioridad, RangoJuridico, TipoRelacion } from "@prisma/client";
import {
  createRequisito,
  updateRequisito,
  updateDatosGenerales,
  updateContenidoAplicabilidad,
  getRequisitoRaw,
  getAreasRequisito,
  type RequisitoFormData,
} from "@/lib/data/requisitos";
import { registrarCreacionRequisito, registrarEdicionRequisito } from "@/lib/historial";
import { getUsuarioActualNombre } from "@/lib/actuandoComo";

function leerCampos(formData: FormData): RequisitoFormData {
  const normaMadreId = String(formData.get("normaMadreId") ?? "").trim();
  return {
    codigoNormativo: String(formData.get("codigoNormativo") ?? "").trim(),
    nombreOficial: String(formData.get("nombreOficial") ?? "").trim(),
    bloqueTematicoId: String(formData.get("bloqueTematicoId")),
    estado: String(formData.get("estado")) as EstadoRequisito,
    aplicabilidad: String(formData.get("aplicabilidad") ?? "").trim() || null,
    rangoJuridico: String(formData.get("rangoJuridico")) as RangoJuridico,
    nivelVigilancia: String(formData.get("nivelVigilancia")) as NivelVigilancia,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    requisitoArticuloClave: String(formData.get("requisitoArticuloClave") ?? "").trim() || null,
    fuenteAVerificar: String(formData.get("fuenteAVerificar") ?? "").trim() || null,
    comoDemostrarCumplimiento: String(formData.get("comoDemostrarCumplimiento") ?? "").trim() || null,
    frecuenciaRevision: String(formData.get("frecuenciaRevision") ?? "").trim() || null,
    organismoFiscalizador: String(formData.get("organismoFiscalizador") ?? "").trim() || null,
    prioridad: String(formData.get("prioridad")) as Prioridad,
    normaMadreId: normaMadreId || null,
    tipoRelacion: String(formData.get("tipoRelacion")) as TipoRelacion,
    areas: formData.getAll("areas").map((a) => String(a) as Area),
  };
}

export async function createRequisitoAction(formData: FormData) {
  const data = leerCampos(formData);
  if (!data.codigoNormativo || !data.nombreOficial) {
    throw new Error("Faltan campos obligatorios.");
  }
  const requisito = await createRequisito(data);
  const usuarioNombre = await getUsuarioActualNombre();
  await registrarCreacionRequisito(requisito, usuarioNombre);
  revalidatePath("/matriz");
  revalidatePath("/historial");
  redirect(`/requisitos/${requisito.id}`);
}

export async function updateRequisitoAction(id: string, formData: FormData) {
  const data = leerCampos(formData);
  if (!data.codigoNormativo || !data.nombreOficial) {
    throw new Error("Faltan campos obligatorios.");
  }
  const [antes, areasAntes] = await Promise.all([getRequisitoRaw(id), getAreasRequisito(id)]);
  const [, despues] = await updateRequisito(id, data);
  const usuarioNombre = await getUsuarioActualNombre();
  await registrarEdicionRequisito(antes, despues, usuarioNombre, {
    areasAntes,
    areasDespues: data.areas,
  });
  revalidatePath("/matriz");
  revalidatePath(`/requisitos/${id}`);
  revalidatePath("/historial");
  redirect(`/requisitos/${id}`);
}

export async function updateDatosGeneralesAction(id: string, formData: FormData) {
  const antes = await getRequisitoRaw(id);
  const despues = await updateDatosGenerales(id, {
    bloqueTematicoId: String(formData.get("bloqueTematicoId")),
    rangoJuridico: String(formData.get("rangoJuridico")) as RangoJuridico,
    frecuenciaRevision: String(formData.get("frecuenciaRevision") ?? "").trim() || null,
    fuenteAVerificar: String(formData.get("fuenteAVerificar") ?? "").trim() || null,
    organismoFiscalizador: String(formData.get("organismoFiscalizador") ?? "").trim() || null,
  });
  const usuarioNombre = await getUsuarioActualNombre();
  await registrarEdicionRequisito(antes, despues, usuarioNombre, {
    campos: ["bloqueTematicoId", "rangoJuridico", "frecuenciaRevision", "fuenteAVerificar", "organismoFiscalizador"],
  });
  revalidatePath("/matriz");
  revalidatePath(`/requisitos/${id}`);
  revalidatePath("/historial");
  redirect(`/requisitos/${id}`);
}

export async function updateContenidoAplicabilidadAction(id: string, formData: FormData) {
  const antes = await getRequisitoRaw(id);
  const despues = await updateContenidoAplicabilidad(id, {
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    aplicabilidad: String(formData.get("aplicabilidad") ?? "").trim() || null,
    requisitoArticuloClave: String(formData.get("requisitoArticuloClave") ?? "").trim() || null,
    comoDemostrarCumplimiento: String(formData.get("comoDemostrarCumplimiento") ?? "").trim() || null,
  });
  const usuarioNombre = await getUsuarioActualNombre();
  await registrarEdicionRequisito(antes, despues, usuarioNombre, {
    campos: ["descripcion", "aplicabilidad", "requisitoArticuloClave", "comoDemostrarCumplimiento"],
  });
  revalidatePath("/matriz");
  revalidatePath(`/requisitos/${id}`);
  revalidatePath("/historial");
  redirect(`/requisitos/${id}`);
}
