"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EstadoEvaluacion } from "@prisma/client";
import { registrarEvaluacion } from "@/lib/data/evaluaciones";
import { getRequisitoRaw } from "@/lib/data/requisitos";
import { getUsuario } from "@/lib/data/usuarios";
import { registrarEvaluacionHistorial } from "@/lib/historial";

export async function registrarEvaluacionAction(formData: FormData) {
  const requisitoId = String(formData.get("requisitoId"));
  const estado = String(formData.get("estado")) as EstadoEvaluacion;
  const evidencia = String(formData.get("evidencia") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const fecha = String(formData.get("fecha"));
  const usuarioId = String(formData.get("usuarioId"));

  if (!requisitoId || !usuarioId || !fecha) {
    throw new Error("Faltan campos obligatorios para registrar la evaluación.");
  }

  await registrarEvaluacion({
    requisitoId,
    estado,
    evidencia: evidencia || null,
    responsable: responsable || null,
    fecha: new Date(fecha),
    usuarioId,
  });

  const [requisito, usuario] = await Promise.all([getRequisitoRaw(requisitoId), getUsuario(usuarioId)]);
  await registrarEvaluacionHistorial(requisito, estado, usuario?.nombre ?? "Sin identificar");

  revalidatePath(`/requisitos/${requisitoId}`);
  revalidatePath("/historial");
  revalidatePath("/");
  redirect(`/requisitos/${requisitoId}`);
}
