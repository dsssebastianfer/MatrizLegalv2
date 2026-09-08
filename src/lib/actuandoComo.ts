import { cookies } from "next/headers";
import { getUsuario } from "@/lib/data/usuarios";
import { COOKIE_ACTUANDO_COMO } from "@/lib/cookieNames";

export { COOKIE_ACTUANDO_COMO };

// Este cookie lo fija el login (ver src/lib/actions/auth.ts) tras validar el
// correo contra la tabla de usuarios. src/proxy.ts exige que exista para
// dejar pasar cualquier ruta salvo /login; acá solo lo leemos para saber a
// quién atribuirle los cambios que haga (historial de cambios).
export async function getUsuarioActualId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_ACTUANDO_COMO)?.value || null;
}

export async function getUsuarioActual() {
  const id = await getUsuarioActualId();
  if (!id) return null;
  return getUsuario(id);
}

export async function getUsuarioActualNombre(): Promise<string> {
  const usuario = await getUsuarioActual();
  return usuario?.nombre ?? "Sin identificar";
}
