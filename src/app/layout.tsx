import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { SelectorUsuarioActual } from "@/components/SelectorUsuarioActual";
import { listUsuariosActivos } from "@/lib/data/usuarios";
import { getUsuarioActualId } from "@/lib/actuandoComo";
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
  const [usuarios, actualId] = await Promise.all([listUsuariosActivos(), getUsuarioActualId()]);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b-2 border-teal-600/80 dark:border-teal-400/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <span className="font-semibold text-teal-700 dark:text-teal-300">Matriz Legal DSS</span>
            <NavBar />
            <SelectorUsuarioActual usuarios={usuarios} actualId={actualId} />
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
