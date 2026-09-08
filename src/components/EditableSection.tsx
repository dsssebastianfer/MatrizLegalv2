"use client";

import { useState } from "react";

export function EditableSection({
  contenido,
  formulario,
}: {
  contenido: React.ReactNode;
  formulario: React.ReactNode;
}) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="relative rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-4">
      <button
        type="button"
        onClick={() => setEditando((v) => !v)}
        title={editando ? "Cancelar edición" : "Editar"}
        className="absolute top-3 right-3 rounded-md p-1.5 text-black/40 hover:bg-black/5 hover:text-teal-700 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-teal-400"
      >
        {editando ? (
          <span className="text-sm leading-none">✕</span>
        ) : (
          <span className="text-sm leading-none">✏️</span>
        )}
      </button>
      <div className="pr-8">{editando ? formulario : contenido}</div>
    </div>
  );
}
