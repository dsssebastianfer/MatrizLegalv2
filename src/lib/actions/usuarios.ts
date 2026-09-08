"use server";

import { revalidatePath } from "next/cache";
import { createUsuario, updateUsuario } from "@/lib/data/usuarios";

export async function createUsuarioAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  if (!nombre) throw new Error("Falta el nombre del usuario.");
  await createUsuario({ nombre, email });
  revalidatePath("/usuarios");
}

export async function toggleUsuarioActivoAction(id: string, activo: boolean) {
  await updateUsuario(id, { activo });
  revalidatePath("/usuarios");
}
