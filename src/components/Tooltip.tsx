"use client";

import { useRef, useState } from "react";

const ANCHO = 480;
const MARGEN = 8;
const ALTO_ESTIMADO = 200;

export function Tooltip({
  texto,
  children,
  className = "cursor-help border-b border-dotted border-current/40",
}: {
  texto?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  if (!texto) return <>{children}</>;

  function mostrar() {
    setRect(ref.current?.getBoundingClientRect() ?? null);
  }

  function ocultar() {
    setRect(null);
  }

  // Posición calculada en base al espacio real disponible en la ventana, para
  // que nunca quede cortado por el scroll horizontal de una tabla ni por el
  // borde de la pantalla (usa position: fixed, así escapa cualquier overflow
  // de los contenedores padres).
  const mostrarArriba = rect ? window.innerHeight - rect.bottom < ALTO_ESTIMADO : false;
  const left = rect ? Math.min(Math.max(MARGEN, rect.left), window.innerWidth - ANCHO - MARGEN) : 0;

  return (
    <span
      ref={ref}
      tabIndex={0}
      className={className}
      onMouseEnter={mostrar}
      onMouseLeave={ocultar}
      onFocus={mostrar}
      onBlur={ocultar}
    >
      {children}
      {rect && (
        <span
          className="fixed z-50 whitespace-pre-line rounded-md border border-black/10 bg-white p-3 text-xs leading-relaxed font-normal normal-case text-black shadow-lg dark:border-white/10 dark:bg-neutral-800 dark:text-white"
          style={{
            width: ANCHO,
            left,
            maxHeight: "70vh",
            overflowY: "auto",
            ...(mostrarArriba
              ? { bottom: window.innerHeight - rect.top + 4 }
              : { top: rect.bottom + 4 }),
          }}
        >
          {texto.split("\n").flatMap((linea, i, arr) =>
            i === arr.length - 1 ? [<span key={i}>{linea}</span>] : [<span key={i}>{linea}</span>, <br key={`br-${i}`} />],
          )}
        </span>
      )}
    </span>
  );
}
