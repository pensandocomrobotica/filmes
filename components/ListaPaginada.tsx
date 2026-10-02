"use client";

import { useState } from "react";
import GradeFilmes from "./GradeFilmes";
import { anexarSemDuplicar } from "@/lib/paginacao";
import type { PaginaFilmes } from "@/lib/tmdb/tipos";

type Props = {
  inicial: PaginaFilmes;
  // Query da busca atual, sem a página. Ex.: "plataformas=8&ordem=recentes" ou "q=matrix".
  consulta: string;
};

export default function ListaPaginada({ inicial, consulta }: Props) {
  const [filmes, setFilmes] = useState(inicial.filmes);
  const [pagina, setPagina] = useState(inicial.pagina);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  const temMais = pagina < inicial.totalPaginas;

  async function carregarMais() {
    setCarregando(true);
    setErro(false);
    try {
      const separador = consulta ? "&" : "";
      const resposta = await fetch(`/api/filmes?${consulta}${separador}pagina=${pagina + 1}`);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const proxima: PaginaFilmes = await resposta.json();
      setFilmes((atuais) => anexarSemDuplicar(atuais, proxima.filmes));
      setPagina(proxima.pagina);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <GradeFilmes filmes={filmes} />

      <div className="mt-8 flex flex-col items-center gap-3">
        {erro && <p className="text-sm text-apagado">Não conseguimos carregar os filmes agora</p>}
        {temMais && (
          <button
            type="button"
            onClick={carregarMais}
            disabled={carregando}
            className="rounded-full border border-borda bg-superficie px-6 py-2 font-medium hover:border-destaque disabled:opacity-50"
          >
            {carregando ? "Carregando..." : erro ? "Tentar novamente" : "Carregar mais"}
          </button>
        )}
      </div>
    </>
  );
}
