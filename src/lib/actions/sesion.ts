"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_ACTUANDO_COMO } from "@/lib/actuandoComo";

export async function setUsuarioActualAction(formData: FormData) {
  const usuarioId = String(formData.get("usuarioId") ?? "").trim();
  const store = await cookies();
  if (usuarioId) {
    store.set(COOKIE_ACTUANDO_COMO, usuarioId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } else {
    store.delete(COOKIE_ACTUANDO_COMO);
  }
  revalidatePath("/", "layout");
}
