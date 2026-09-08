"use server";

import { revalidatePath } from "next/cache";
import { createUsuario, updateUsuario } from "@/lib/data/usuarios";

export async function createUsuarioAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  if (!nombre) throw new Error("Falta el nombre del usuario.");
  if (!email) throw new Error("Falta el correo: sin él la persona no podrá entrar a la app.");
  await createUsuario({ nombre, email });
  revalidatePath("/usuarios");
}

export async function toggleUsuarioActivoAction(id: string, activo: boolean) {
  await updateUsuario(id, { activo });
  revalidatePath("/usuarios");
}
