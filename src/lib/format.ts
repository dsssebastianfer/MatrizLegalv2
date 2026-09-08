export function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(fecha);
}

export function formatearFechaHora(fecha: Date) {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(fecha);
}
