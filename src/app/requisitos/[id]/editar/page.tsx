import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequisitoDetalle, listBloquesTematicos, listRequisitosParaSelector } from "@/lib/data/requisitos";
import { updateRequisitoAction } from "@/lib/actions/requisitos";
import { RequisitoForm } from "@/components/RequisitoForm";

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
    </div>
  );
}
