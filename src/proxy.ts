import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_ACTUANDO_COMO } from "@/lib/cookieNames";
import { prisma } from "@/lib/db";

// Exige sesión (cookie fijado por el login, ver src/lib/actions/auth.ts) para
// cualquier ruta salvo /login. Valida contra la base en cada request (Proxy
// corre en runtime Node.js desde Next 16, así que esto es viable) para que
// desactivar a alguien en /usuarios le corte el acceso de inmediato, no solo
// le bloquee el próximo login.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const usuarioId = request.cookies.get(COOKIE_ACTUANDO_COMO)?.value;
  const sesionValida = usuarioId
    ? await prisma.usuario
        .findFirst({ where: { id: usuarioId, activo: true }, select: { id: true } })
        .then((u) => Boolean(u))
        .catch(() => false)
    : false;

  if (!sesionValida) {
    const next = encodeURIComponent(pathname + search);
    const response = NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
    response.cookies.delete(COOKIE_ACTUANDO_COMO);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
