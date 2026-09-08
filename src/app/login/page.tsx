import { loginAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const hayError = params.error === "1";
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/";

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-teal-700 dark:text-teal-300">Matriz Legal DSS</h1>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
            Ingresa con el correo con el que estás registrado.
          </p>
        </div>
        <form action={loginAction} className="space-y-3 rounded-lg border border-black/10 dark:border-white/10 p-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-black/60 dark:text-white/60">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="nombre@dss.cl"
              className="field"
            />
          </label>
          {hayError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Ese correo no está registrado (o está desactivado). Pide que te agreguen en Usuarios.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
