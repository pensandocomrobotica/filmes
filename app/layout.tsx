import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
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
  title: {
    default: "Catálogo de Filmes",
    template: "%s · Catálogo de Filmes",
  },
  description: "Filmes disponíveis nas plataformas de streaming do Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Cabecalho />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
