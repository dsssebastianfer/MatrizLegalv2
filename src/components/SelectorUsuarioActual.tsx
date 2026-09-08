"use client";

import { setUsuarioActualAction } from "@/lib/actions/sesion";

export function SelectorUsuarioActual({
  usuarios,
  actualId,
}: {
  usuarios: { id: string; nombre: string }[];
  actualId: string | null;
}) {
  return (
    <form action={setUsuarioActualAction} className="ml-auto flex items-center gap-1.5 text-xs">
      <span className="hidden text-black/50 dark:text-white/50 sm:inline">Actuando como</span>
      <select
        name="usuarioId"
        defaultValue={actualId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        title="Elige tu usuario: se usa para registrar quién hizo cada cambio en el historial"
        className="field py-1 text-xs"
      >
        <option value="">Sin identificar</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
