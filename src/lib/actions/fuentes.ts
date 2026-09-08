"use server";

import { revalidatePath } from "next/cache";
import { createFuente, deleteFuente, updateFuente } from "@/lib/data/fuentes";

function leerCampos(formData: FormData) {
  const ultimaRevisionRaw = String(formData.get("ultimaRevision") ?? "").trim();
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim() || null,
    frecuencia: String(formData.get("frecuencia") ?? "").trim() || null,
    responsable: String(formData.get("responsable") ?? "").trim() || null,
    ultimaRevision: ultimaRevisionRaw ? new Date(ultimaRevisionRaw) : null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  };
}

export async function createFuenteAction(formData: FormData) {
  const data = leerCampos(formData);
  if (!data.nombre) throw new Error("Falta el nombre de la fuente.");
  await createFuente(data);
  revalidatePath("/vigilancia");
}

export async function updateFuenteAction(id: string, formData: FormData) {
  const data = leerCampos(formData);
  if (!data.nombre) throw new Error("Falta el nombre de la fuente.");
  await updateFuente(id, data);
  revalidatePath("/vigilancia");
}

export async function deleteFuenteAction(id: string) {
  await deleteFuente(id);
  revalidatePath("/vigilancia");
}
