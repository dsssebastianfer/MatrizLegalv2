// Nombre del cookie de sesión, en su propio archivo sin más dependencias:
// lo usan tanto src/lib/actuandoComo.ts (que sí toca la base de datos) como
// src/proxy.ts (que corre en cada request y debe mantenerse liviano).
export const COOKIE_ACTUANDO_COMO = "actuando_como";
