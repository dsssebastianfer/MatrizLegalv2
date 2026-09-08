"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ACTUANDO_COMO } from "@/lib/cookieNames";
import { getUsuarioActivoPorEmail } from "@/lib/data/usuarios";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/") || "/";

  const usuario = email ? await getUsuarioActivoPorEmail(email) : null;

  if (!usuario) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const store = await cookies();
  store.set(COOKIE_ACTUANDO_COMO, usuario.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });

  redirect(next);
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(COOKIE_ACTUANDO_COMO);
  redirect("/login");
}
