import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { getUsuarioActual } from "@/lib/actuandoComo";
import { logoutAction } from "@/lib/actions/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matriz Legal DSS",
  description: "Gestión de requisitos legales — DSS S.A.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b-2 border-teal-600/80 dark:border-teal-400/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <span className="font-semibold text-teal-700 dark:text-teal-300">Matriz Legal DSS</span>
            {usuario && <NavBar />}
            {usuario && (
              <form action={logoutAction} className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-black/50 dark:text-white/50">{usuario.nombre}</span>
                <button type="submit" className="link-accent">
                  Cerrar sesión
                </button>
              </form>
            )}
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
