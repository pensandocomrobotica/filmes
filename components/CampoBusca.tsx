"use client";

import { usePathname, useSearchParams } from "next/navigation";

export const CLASSES_CAMPO_BUSCA =
  "w-full rounded-full border border-borda bg-superficie px-4 py-2 text-sm outline-none placeholder:text-apagado focus:border-destaque";

// Campo de busca já preenchido com o termo atual quando estamos em /busca.
export default function CampoBusca() {
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
  const valorInicial = pathname === "/busca" ? q : "";

  return (
    <input
      // A key recria o campo quando o termo da URL muda.
      key={valorInicial}
      id="busca"
      name="q"
      type="search"
      defaultValue={valorInicial}
      placeholder="🔍 Buscar filme..."
      className={CLASSES_CAMPO_BUSCA}
    />
  );
}
