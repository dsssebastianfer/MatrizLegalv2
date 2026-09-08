import { prisma } from "@/lib/db";
import { ImpactoCambio } from "@prisma/client";

export interface CambioFormData {
  fecha?: Date | null;
  tipo?: string | null;
  numeroCodigo?: string | null;
  nombre?: string | null;
  normaOParteQueActualiza?: string | null;
  // Algunas circulares no modifican ninguna norma que esté hoy en la Matriz.
  requisitoBaseId?: string | null;
  queCambio?: string | null;
  impacto: ImpactoCambio;
  nota?: string | null;
}

export async function listCambios() {
  return prisma.cambioNormativo.findMany({
    include: {
      requisitoBase: { select: { id: true, codigoNormativo: true, nombreOficial: true } },
    },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCambio(id: string) {
  return prisma.cambioNormativo.findUnique({
    where: { id },
    include: {
      requisitoBase: { select: { id: true, codigoNormativo: true, nombreOficial: true } },
    },
  });
}

export async function createCambio(data: CambioFormData) {
  return prisma.cambioNormativo.create({ data });
}

export async function updateCambio(id: string, data: CambioFormData) {
  return prisma.cambioNormativo.update({ where: { id }, data });
}
