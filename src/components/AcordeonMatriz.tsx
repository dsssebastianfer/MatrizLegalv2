"use client";

import { useState } from "react";

export interface GrupoTematico {
  id: string;
  nombre: string;
  contenido: React.ReactNode;
}

export function AcordeonMatriz({ grupos }: { grupos: GrupoTematico[] }) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const todosAbiertos = grupos.length > 0 && grupos.every((g) => abiertos.has(g.id));

  function alternarTodos() {
    setAbiertos(todosAbiertos ? new Set() : new Set(grupos.map((g) => g.id)));
  }

  function alternarUno(id: string) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  return (
    <div className="space-y-4">
      {grupos.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={alternarTodos} className="btn-secondary text-sm">
            {todosAbiertos ? "Contraer todo" : "Desplegar todo"}
          </button>
        </div>
      )}
      <div className="space-y-4">
        {grupos.map((g) => {
          const abierto = abiertos.has(g.id);
          return (
            <section key={g.id} className="rounded-lg border border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => alternarUno(g.id)}
                aria-expanded={abierto}
                className="section-heading flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left text-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              >
                <span
                  className={`text-black/40 transition-transform dark:text-white/40 ${abierto ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                {g.nombre}
              </button>
              {abierto && <div className="px-3 pb-3">{g.contenido}</div>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
