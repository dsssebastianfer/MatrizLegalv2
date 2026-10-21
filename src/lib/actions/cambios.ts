"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ImpactoCambio } from "@prisma/client";
import { createCambio, getCambioRaw, restoreCambio, softDeleteCambio, updateCambio } from "@/lib/data/cambios";
import {
  registrarCreacionCambio,
  registrarEdicionCambio,
  registrarEliminacionCambio,
  registrarRestauracionCambio,
} from "@/lib/historial";
import { getUsuarioActualNombre } from "@/lib/actuandoComo";

function leerCampos(formData: FormData) {
  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  const requisitoBaseId = String(formData.get("requisitoBaseId") ?? "").trim();
  return {
    fecha: fechaRaw ? new Date(fechaRaw) : null,
    tipo: String(formData.get("tipo") ?? "").trim() || null,
    numeroCodigo: String(formData.get("numeroCodigo") ?? "").trim() || null,
    nombre: String(formData.get("nombre") ?? "").trim() || null,
    normaOParteQueActualiza: String(formData.get("normaOParteQueActualiza") ?? "").trim() || null,
    // Algunas circulares no modifican ninguna norma que esté hoy en la Matriz.
    requisitoBaseId: requisitoBaseId || null,
    queCambio: String(formData.get("queCambio") ?? "").trim() || null,
    impacto: String(formData.get("impacto")) as ImpactoCambio,
    nota: String(formData.get("nota") ?? "").trim() || null,
  };
}

function revalidarBitacora(...requisitoIds: (string | null)[]) {
  revalidatePath("/bitacora");
  revalidatePath("/historial");
  for (const id of requisitoIds) if (id) revalidatePath(`/requisitos/${id}`);
}

export async function createCambioAction(formData: FormData) {
  const cambio = await createCambio(leerCampos(formData));
  await registrarCreacionCambio(cambio, await getUsuarioActualNombre());
  revalidarBitacora(cambio.requisitoBaseId);
  redirect("/bitacora");
}

export async function updateCambioAction(id: string, formData: FormData) {
  const antes = await getCambioRaw(id);
  const despues = await updateCambio(id, leerCampos(formData));
  await registrarEdicionCambio(antes, despues, await getUsuarioActualNombre());
  revalidarBitacora(antes.requisitoBaseId, despues.requisitoBaseId);
  redirect("/bitacora");
}

export async function eliminarCambioAction(id: string, formData: FormData) {
  const justificacion = String(formData.get("justificacion") ?? "").trim();
  if (!justificacion) {
    throw new Error("La justificación es obligatoria para eliminar un registro de la bitácora.");
  }
  const cambio = await softDeleteCambio(id);
  await registrarEliminacionCambio(cambio, justificacion, await getUsuarioActualNombre());
  revalidarBitacora(cambio.requisitoBaseId);
  redirect("/bitacora");
}

export async function restaurarCambioAction(id: string) {
  const cambio = await restoreCambio(id);
  await registrarRestauracionCambio(cambio, await getUsuarioActualNombre());
  revalidarBitacora(cambio.requisitoBaseId);
  redirect(`/bitacora/${id}`);
}
