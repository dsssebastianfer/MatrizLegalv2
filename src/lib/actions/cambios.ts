"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ImpactoCambio } from "@prisma/client";
import { createCambio, updateCambio } from "@/lib/data/cambios";

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

export async function createCambioAction(formData: FormData) {
  const data = leerCampos(formData);
  await createCambio(data);
  revalidatePath("/bitacora");
  redirect("/bitacora");
}

export async function updateCambioAction(id: string, formData: FormData) {
  const data = leerCampos(formData);
  await updateCambio(id, data);
  revalidatePath("/bitacora");
  if (data.requisitoBaseId) revalidatePath(`/requisitos/${data.requisitoBaseId}`);
  redirect("/bitacora");
}
