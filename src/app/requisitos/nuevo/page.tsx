import Link from "next/link";
import { listBloquesTematicos, listRequisitosParaSelector } from "@/lib/data/requisitos";
import { createRequisitoAction } from "@/lib/actions/requisitos";
import { RequisitoForm } from "@/components/RequisitoForm";

export const dynamic = "force-dynamic";

export default async function NuevoRequisitoPage() {
  const [bloques, normas] = await Promise.all([listBloquesTematicos(), listRequisitosParaSelector()]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/matriz" className="text-sm link-accent">
          ← Volver a la Matriz
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Nueva norma</h1>
      </div>
      <RequisitoForm action={createRequisitoAction} bloques={bloques} normasDisponibles={normas} submitLabel="Crear norma" />
    </div>
  );
}
