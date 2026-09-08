import { prisma } from "@/lib/db";

export interface FuenteFormData {
  nombre: string;
  url?: string | null;
  frecuencia?: string | null;
  responsable?: string | null;
  ultimaRevision?: Date | null;
  notas?: string | null;
}

export async function listFuentes() {
  return prisma.fuenteVigilancia.findMany({ orderBy: { nombre: "asc" } });
}

export async function createFuente(data: FuenteFormData) {
  return prisma.fuenteVigilancia.create({ data });
}

export async function updateFuente(id: string, data: FuenteFormData) {
  return prisma.fuenteVigilancia.update({ where: { id }, data });
}

export async function deleteFuente(id: string) {
  return prisma.fuenteVigilancia.delete({ where: { id } });
}
