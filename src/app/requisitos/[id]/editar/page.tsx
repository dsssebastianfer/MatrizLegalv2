import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequisitoDetalle, listBloquesTematicos, listRequisitosParaSelector } from "@/lib/data/requisitos";
import { updateRequisitoAction, eliminarRequisitoAction } from "@/lib/actions/requisitos";
import { RequisitoForm } from "@/components/RequisitoForm";
import { BotonConfirmar } from "@/components/BotonConfirmar";

export const dynamic = "force-dynamic";

export default async function EditarRequisitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [requisito, bloques, normas] = await Promise.all([
    getRequisitoDetalle(id),
    listBloquesTematicos(),
    listRequisitosParaSelector(),
  ]);

  if (!requisito) notFound();

  const actionConId = updateRequisitoAction.bind(null, id);
  const eliminarConId = eliminarRequisitoAction.bind(null, id);
  const normasDisponibles = normas.filter((n) => n.id !== id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/requisitos/${id}`} className="text-sm link-accent">
          ← Volver al detalle
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Editar norma</h1>
      </div>
      <RequisitoForm
        action={actionConId}
        bloques={bloques}
        normasDisponibles={normasDisponibles}
        valores={{
          codigoNormativo: requisito.codigoNormativo,
          nombreOficial: requisito.nombreOficial,
          bloqueTematicoId: requisito.bloqueTematicoId,
          estado: requisito.estado,
          aplicabilidad: requisito.aplicabilidad,
          rangoJuridico: requisito.rangoJuridico,
          nivelVigilancia: requisito.nivelVigilancia,
          descripcion: requisito.descripcion,
          requisitoArticuloClave: requisito.requisitoArticuloClave,
          fuenteAVerificar: requisito.fuenteAVerificar,
          comoDemostrarCumplimiento: requisito.comoDemostrarCumplimiento,
          frecuenciaRevision: requisito.frecuenciaRevision,
          organismoFiscalizador: requisito.organismoFiscalizador,
          prioridad: requisito.prioridad,
          normaMadreId: requisito.normaMadreId,
          tipoRelacion: requisito.tipoRelacion,
          areas: requisito.areas.map((a) => a.area),
        }}
        submitLabel="Guardar cambios"
      />

      {!requisito.eliminadoEn && (
        <details className="rounded-lg border border-red-300 dark:border-red-900/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
            Eliminar esta norma
          </summary>
          <div className="px-4 pb-4">
            <p className="text-sm text-black/60 dark:text-white/60 mb-3">
              La norma deja de aparecer en la Matriz y en los selectores, pero su historial y evaluaciones se
              conservan. Se puede restaurar después desde la ficha de la norma.
            </p>
            <form action={eliminarConId} className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-black/60 dark:text-white/60">Justificación de la eliminación</span>
                <textarea name="justificacion" required rows={3} className="field" />
              </label>
              <BotonConfirmar
                mensaje={`¿Eliminar «${requisito.codigoNormativo}»? Se puede restaurar después, pero dejará de verse en la Matriz.`}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar norma
              </BotonConfirmar>
            </form>
          </div>
        </details>
      )}
    </div>
  );
}
