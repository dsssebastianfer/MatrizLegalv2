import { prisma } from "@/lib/db";
import { TipoEventoHistorial, type Prisma } from "@prisma/client";

export interface CambioCampo {
  campo: string;
  etiqueta: string;
  antes: string;
  despues: string;
}

export interface CrearHistorialInput {
  tipo: TipoEventoHistorial;
  requisitoId?: string | null;
  codigoNormativo?: string | null;
  usuarioNombre: string;
  resumen: string;
  cambios?: CambioCampo[] | null;
}

export async function crearHistorial(data: CrearHistorialInput) {
  return prisma.historialCambio.create({
    data: {
      tipo: data.tipo,
      requisitoId: data.requisitoId ?? null,
      codigoNormativo: data.codigoNormativo ?? null,
      usuarioNombre: data.usuarioNombre,
      resumen: data.resumen,
      cambios: (data.cambios ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listHistorial(opts?: { requisitoId?: string; limit?: number }) {
  const filas = await prisma.historialCambio.findMany({
    where: opts?.requisitoId ? { requisitoId: opts.requisitoId } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit,
  });
  return filas.map((f) => ({ ...f, cambios: f.cambios as unknown as CambioCampo[] | null }));
}
