import Link from "next/link";
import { Area, EstadoEvaluacion, EstadoRequisito, NivelVigilancia, Prioridad } from "@prisma/client";
import { getMatriz, listBloquesTematicos, type NodoRequisito } from "@/lib/data/requisitos";
import { getUltimasEvaluaciones } from "@/lib/data/evaluaciones";
import {
  ETIQUETA_AREA,
  ETIQUETA_ESTADO_EVALUACION,
  ETIQUETA_ESTADO_REQUISITO,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_RELACION,
  ETIQUETA_VIGILANCIA,
  COLOR_ESTADO_EVALUACION,
  COLOR_ESTADO_REQUISITO,
  COLOR_PRIORIDAD,
  DESCRIPCION_CONCEPTO,
} from "@/lib/labels";
import { formatearFecha } from "@/lib/format";
import { Badge } from "@/components/Badge";
import { Tooltip } from "@/components/Tooltip";
import { AcordeonMatriz } from "@/components/AcordeonMatriz";

type UltimaEvaluacion = { estado: EstadoEvaluacion; fecha: Date } | undefined;

function collectIds(nodos: NodoRequisito[]): string[] {
  return nodos.flatMap((n) => [n.id, ...collectIds(n.hijas)]);
}

export const dynamic = "force-dynamic";

function parseEnumValue<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

interface FilaProps {
  nodo: NodoRequisito;
  profundidad: number;
  ultimasEvaluaciones: Map<string, UltimaEvaluacion>;
}

function FilaRequisito({ nodo, profundidad, ultimasEvaluaciones }: FilaProps) {
  const ultima = ultimasEvaluaciones.get(nodo.id);

  return (
    <>
      <tr className="border-b border-black/5 dark:border-white/10 last:border-0">
        <td className="py-2 pr-3 text-black/50 dark:text-white/50">{nodo.legacyId ?? "—"}</td>
        <td className="py-2 pr-3" style={{ paddingLeft: `${profundidad * 1.25}rem` }}>
          <Link href={`/requisitos/${nodo.id}`} className="link-accent font-medium">
            {profundidad > 0 && <span className="text-black/30 dark:text-white/30 mr-1">↳</span>}
            {nodo.codigoNormativo}
          </Link>
          {profundidad === 0 && nodo.normaMadreId && nodo.normaMadre && (
            <div className="text-xs text-black/50 dark:text-white/50">
              {ETIQUETA_TIPO_RELACION[nodo.tipoRelacion]} de{" "}
              <Link href={`/requisitos/${nodo.normaMadre.id}`} className="link-accent">
                {nodo.normaMadre.codigoNormativo}
              </Link>{" "}
              ({nodo.normaMadre.bloqueTematico.nombre})
            </div>
          )}
        </td>
        <td className="py-2 pr-3">{nodo.nombreOficial}</td>
        <td className="py-2 pr-3">
          <Tooltip texto={nodo.aplicabilidad}>
            <Badge className={COLOR_ESTADO_REQUISITO[nodo.estado]}>
              {ETIQUETA_ESTADO_REQUISITO[nodo.estado]}
            </Badge>
          </Tooltip>
        </td>
        <td className="py-2 pr-3">
          <div className="flex flex-col gap-0.5">
            <Badge
              className={
                ultima
                  ? COLOR_ESTADO_EVALUACION[ultima.estado]
                  : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
              }
            >
              {ultima ? ETIQUETA_ESTADO_EVALUACION[ultima.estado] : "Sin evaluar"}
            </Badge>
            <span className="text-xs text-black/50 dark:text-white/50">
              {ultima ? formatearFecha(ultima.fecha) : "—"}
            </span>
          </div>
        </td>
        <td className="py-2 pr-3">
          <Badge className={COLOR_PRIORIDAD[nodo.prioridad]}>{ETIQUETA_PRIORIDAD[nodo.prioridad]}</Badge>
        </td>
        <td className="py-2 pr-3">{ETIQUETA_VIGILANCIA[nodo.nivelVigilancia]}</td>
        <td className="py-2 pr-3">
          <div className="flex flex-col gap-1">
            {nodo.areas.map(({ area }) => (
              <Badge key={area} className="bg-black/5 dark:bg-white/10">
                {ETIQUETA_AREA[area]}
              </Badge>
            ))}
          </div>
        </td>
      </tr>
      {nodo.hijas.map((hija) => (
        <FilaRequisito
          key={hija.id}
          nodo={hija}
          profundidad={profundidad + 1}
          ultimasEvaluaciones={ultimasEvaluaciones}
        />
      ))}
    </>
  );
}

export default async function MatrizPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const busqueda = typeof params.q === "string" ? params.q : undefined;
  const bloqueTematicoId = typeof params.bloque === "string" && params.bloque !== "" ? params.bloque : undefined;
  const estadosParam = params.estado === undefined ? [] : Array.isArray(params.estado) ? params.estado : [params.estado];
  const estados = estadosParam.filter((v): v is EstadoRequisito =>
    (Object.values(EstadoRequisito) as string[]).includes(v),
  );
  const area = parseEnumValue(typeof params.area === "string" ? params.area : undefined, Object.values(Area));
  const prioridad = parseEnumValue(typeof params.prioridad === "string" ? params.prioridad : undefined, Object.values(Prioridad));
  const nivelVigilancia = parseEnumValue(
    typeof params.vigilancia === "string" ? params.vigilancia : undefined,
    Object.values(NivelVigilancia),
  );

  const [bloques, matriz] = await Promise.all([
    listBloquesTematicos(),
    getMatriz({ busqueda, bloqueTematicoId, estados, area, prioridad, nivelVigilancia }),
  ]);

  const idsVisibles = matriz.flatMap((bloque) => collectIds(bloque.requisitos));
  const ultimasEvaluaciones = await getUltimasEvaluaciones(idsVisibles);

  const hayFiltros = Boolean(
    busqueda || bloqueTematicoId || estados.length > 0 || area || prioridad || nivelVigilancia,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Matriz de requisitos</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Agrupada por bloque temático. Las normas madre muestran sus normas relacionadas anidadas.
          </p>
        </div>
        <Link href="/requisitos/nuevo" className="btn-primary whitespace-nowrap">
          + Nueva norma
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
        <label className="flex flex-col gap-1 w-full sm:w-72">
          <span className="text-xs text-black/60 dark:text-white/60">Buscar</span>
          <input
            type="search"
            name="q"
            defaultValue={busqueda ?? ""}
            placeholder="ID, código, nombre o contenido de la norma..."
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Bloque temático</span>
          <select name="bloque" defaultValue={bloqueTematicoId ?? ""} className="field">
            <option value="">Todos</option>
            {bloques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">
            Estado (marca los que quieres ver; ninguno marcado = todos)
          </span>
          <div className="field flex flex-wrap items-center gap-x-3 gap-y-1">
            {Object.values(EstadoRequisito).map((e) => (
              <label key={e} className="flex items-center gap-1.5 whitespace-nowrap">
                <input type="checkbox" name="estado" value={e} defaultChecked={estados.includes(e)} className="h-4 w-4" />
                {ETIQUETA_ESTADO_REQUISITO[e]}
              </label>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">Área</span>
          <select name="area" defaultValue={area ?? ""} className="field">
            <option value="">Todas</option>
            {Object.values(Area).map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_AREA[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">
            <Tooltip texto={DESCRIPCION_CONCEPTO.prioridad}>Prioridad</Tooltip>
          </span>
          <select name="prioridad" defaultValue={prioridad ?? ""} className="field">
            <option value="">Todas</option>
            {Object.values(Prioridad).map((p) => (
              <option key={p} value={p}>
                {ETIQUETA_PRIORIDAD[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-black/60 dark:text-white/60">
            <Tooltip texto={DESCRIPCION_CONCEPTO.vigilancia}>Vigilancia</Tooltip>
          </span>
          <select name="vigilancia" defaultValue={nivelVigilancia ?? ""} className="field">
            <option value="">Todas</option>
            {Object.values(NivelVigilancia).map((v) => (
              <option key={v} value={v}>
                {ETIQUETA_VIGILANCIA[v]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/matriz" className="px-3 py-1.5 text-teal-700 hover:underline dark:text-teal-400">
            Limpiar filtros
          </Link>
        )}
      </form>

      <AcordeonMatriz
        grupos={matriz.map((bloque) => ({
          id: bloque.id,
          nombre: bloque.nombre,
          contenido: (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
                    <th className="py-1.5 pr-3 font-medium">ID</th>
                    <th className="py-1.5 pr-3 font-medium">Código normativo</th>
                    <th className="py-1.5 pr-3 font-medium">Nombre oficial</th>
                    <th className="py-1.5 pr-3 font-medium">Estado</th>
                    <th className="py-1.5 pr-3 font-medium">Última revisión</th>
                    <th className="py-1.5 pr-3 font-medium">
                      <Tooltip texto={DESCRIPCION_CONCEPTO.prioridad}>Prioridad</Tooltip>
                    </th>
                    <th className="py-1.5 pr-3 font-medium">
                      <Tooltip texto={DESCRIPCION_CONCEPTO.vigilancia}>Vigilancia</Tooltip>
                    </th>
                    <th className="py-1.5 pr-3 font-medium">Área</th>
                  </tr>
                </thead>
                <tbody>
                  {bloque.requisitos.map((nodo) => (
                    <FilaRequisito
                      key={nodo.id}
                      nodo={nodo}
                      profundidad={0}
                      ultimasEvaluaciones={ultimasEvaluaciones}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ),
        }))}
      />
      {matriz.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          No hay requisitos que coincidan con estos filtros.
        </p>
      )}
    </div>
  );
}
