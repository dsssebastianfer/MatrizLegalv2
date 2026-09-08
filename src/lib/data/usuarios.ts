import { prisma } from "@/lib/db";

export async function listUsuarios() {
  return prisma.usuario.findMany({ orderBy: { nombre: "asc" } });
}

export async function listUsuariosActivos() {
  return prisma.usuario.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
}

export async function getUsuario(id: string) {
  return prisma.usuario.findUnique({ where: { id } });
}

// El correo se guarda siempre en minúsculas (ver createUsuarioAction), así
// que la búsqueda para el login normaliza igual y no necesita "mode: insensitive".
export async function getUsuarioActivoPorEmail(email: string) {
  return prisma.usuario.findFirst({ where: { email: email.trim().toLowerCase(), activo: true } });
}

export async function createUsuario(data: { nombre: string; email?: string | null }) {
  return prisma.usuario.create({ data });
}

export async function updateUsuario(
  id: string,
  data: { nombre?: string; email?: string | null; activo?: boolean },
) {
  return prisma.usuario.update({ where: { id }, data });
}
