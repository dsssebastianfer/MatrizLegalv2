"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/Tooltip";
import type { IndiceBloque, IndiceNodo } from "@/lib/data/requisitos";

function ItemIndice({
  nodo,
  profundidad,
  pathname,
}: {
  nodo: IndiceNodo;
  profundidad: number;
  pathname: string;
}) {
  const href = `/requisitos/${nodo.id}`;
  const activo = pathname === href;

  return (
    <>
      <li>
        <Tooltip texto={nodo.nombreOficial}>
          <Link
            href={href}
            style={{ paddingLeft: `${0.5 + profundidad * 0.75}rem` }}
            className={
              activo
                ? "block rounded py-0.5 pr-1.5 bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
                : "block rounded py-0.5 pr-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            }
          >
            {profundidad > 0 && <span className="text-black/30 dark:text-white/30">↳ </span>}
            <span className="text-black/40 dark:text-white/40">{nodo.legacyId ?? "—"}</span>{" "}
            {nodo.codigoNormativo}
          </Link>
        </Tooltip>
      </li>
      {nodo.hijas.map((hija) => (
        <ItemIndice key={hija.id} nodo={hija} profundidad={profundidad + 1} pathname={pathname} />
      ))}
    </>
  );
}

export function IndiceNormas({ bloques }: { bloques: IndiceBloque[] }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative hidden xl:inline-block">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="btn-secondary text-sm"
        title="Índice de normas"
      >
        Índice {abierto ? "▴" : "▾"}
      </button>
      {abierto && (
        <aside className="absolute top-full right-0 z-30 mt-2 w-72">
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-black/10 bg-[var(--background)] p-3 shadow-md dark:border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-teal-700 dark:text-teal-400">Índice de normas</span>
              <button
                onClick={() => setAbierto(false)}
                className="text-xs text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="space-y-1">
              {bloques.map((bloque) => (
                <details key={bloque.id} open className="text-sm">
                  <summary className="cursor-pointer py-1 font-medium text-black/80 dark:text-white/80">
                    {bloque.nombre}
                  </summary>
                  <ul className="space-y-0.5 border-l border-black/10 pb-2 pl-2 dark:border-white/10">
                    {bloque.items.map((item) => (
                      <ItemIndice key={item.id} nodo={item} profundidad={0} pathname={pathname} />
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
