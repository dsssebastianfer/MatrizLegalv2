import { listUsuarios } from "@/lib/data/usuarios";
import { createUsuarioAction, toggleUsuarioActivoAction } from "@/lib/actions/usuarios";
import { Badge } from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuarios = await listUsuarios();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Usuarios</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Se usan para atribuir evaluaciones (&quot;quién evaluó qué&quot;). Todavía no hay login: cualquiera con
          acceso a esta app puede evaluar a nombre de un usuario registrado aquí.
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-teal-700 dark:text-teal-400">Agregar usuario</summary>
        <form action={createUsuarioAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Nombre</span>
            <input type="text" name="nombre" required className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Email</span>
            <input type="email" name="email" className="field" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </details>

      <div className="divide-y divide-black/5 dark:divide-white/10">
        {usuarios.map((usuario) => {
          const toggleAction = toggleUsuarioActivoAction.bind(null, usuario.id, !usuario.activo);
          return (
            <div key={usuario.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{usuario.nombre}</p>
                <p className="text-xs text-black/60 dark:text-white/60">{usuario.email ?? "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={usuario.activo ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"}>
                  {usuario.activo ? "Activo" : "Inactivo"}
                </Badge>
                <form action={toggleAction}>
                  <button type="submit" className="text-xs link-accent">
                    {usuario.activo ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {usuarios.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60 py-4">Todavía no hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
