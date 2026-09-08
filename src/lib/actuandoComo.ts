import { cookies } from "next/headers";
import { getUsuario } from "@/lib/data/usuarios";

// No hay login en la app: este cookie recuerda qué usuario eligió "actuar
// como" en el selector de la barra superior, para poder atribuirle los
// cambios que haga (historial de cambios) sin pedirle el nombre en cada
// formulario.
export const COOKIE_ACTUANDO_COMO = "actuando_como";

export async function getUsuarioActualId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_ACTUANDO_COMO)?.value || null;
}

export async function getUsuarioActualNombre(): Promise<string> {
  const id = await getUsuarioActualId();
  if (!id) return "Sin identificar";
  const usuario = await getUsuario(id);
  return usuario?.nombre ?? "Sin identificar";
}
