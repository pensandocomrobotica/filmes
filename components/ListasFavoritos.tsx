"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EsqueletoGrade from "./EsqueletoGrade";
import GradeFilmes from "./GradeFilmes";
import { listarFavoritos, type ItemFavorito, type Lista } from "@/lib/favoritos";
import type { Filme } from "@/lib/tmdb/tipos";

const SECOES: { lista: Lista; titulo: string }[] = [
  { lista: "favoritos", titulo: "Favoritos" },
  { lista: "quero-assistir", titulo: "Quero assistir" },
];

function paraFilme(item: ItemFavorito): Filme {
  return { id: item.id, titulo: item.titulo, poster: item.poster, nota: item.nota, ano: null };
}

export default function ListasFavoritos() {
  // null = ainda carregando. Os dados só existem no navegador, então são lidos depois de montar.
  const [itens, setItens] = useState<ItemFavorito[] | null>(null);

  useEffect(() => {
    listarFavoritos().then(setItens);
  }, []);

  return (
    <div className="space-y-12">
      {SECOES.map(({ lista, titulo }) => {
        const filmes = itens?.filter((i) => i.lista === lista).map(paraFilme);
        return (
          <section key={lista}>
            <h2 className="mb-4 text-2xl font-semibold">{titulo}</h2>
            {!filmes ? (
              <EsqueletoGrade quantidade={6} />
            ) : filmes.length === 0 ? (
              <p className="text-apagado">
                Nenhum filme aqui ainda.{" "}
                <Link href="/" className="text-destaque underline">
                  Explorar o catálogo
                </Link>
              </p>
            ) : (
              <GradeFilmes filmes={filmes} />
            )}
          </section>
        );
      })}
    </div>
  );
}
