"use client";

import { useEffect, useState } from "react";
import { adicionarFavorito, eFavorito, removerFavorito, type Lista } from "@/lib/favoritos";
import type { Filme } from "@/lib/tmdb/tipos";

type Props = { filme: Filme; lista: Lista; rotulo: string };

export default function BotaoFavorito({ filme, lista, rotulo }: Props) {
  const [marcado, setMarcado] = useState(false);

  useEffect(() => {
    let ativo = true;
    eFavorito(filme.id, lista).then((valor) => {
      if (ativo) setMarcado(valor);
    });
    return () => {
      ativo = false;
    };
  }, [filme.id, lista]);

  async function alternar() {
    if (marcado) await removerFavorito(filme.id, lista);
    else await adicionarFavorito(filme, lista);
    setMarcado(!marcado);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={marcado}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        marcado ? "border-destaque bg-destaque/15 text-destaque" : "border-borda hover:border-apagado"
      }`}
    >
      <span aria-hidden>{marcado ? "★" : "☆"}</span> {rotulo}
    </button>
  );
}
