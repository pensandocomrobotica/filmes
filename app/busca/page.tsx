import type { Metadata } from "next";
import { Suspense } from "react";
import EsqueletoGrade from "@/components/EsqueletoGrade";
import ListaPaginada from "@/components/ListaPaginada";
import { buscarPorNome } from "@/lib/tmdb/filmes";

export const metadata: Metadata = { title: "Busca" };

export default async function Busca({ searchParams }: PageProps<"/busca">) {
  const bruto = (await searchParams).q;
  const q = (Array.isArray(bruto) ? bruto[0] : bruto ?? "").trim();

  if (!q) {
    return <p className="py-20 text-center text-lg text-apagado">Digite o nome de um filme</p>;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Resultados para &ldquo;{q}&rdquo;</h1>
      <Suspense key={q} fallback={<EsqueletoGrade />}>
        <ResultadoBusca q={q} />
      </Suspense>
    </>
  );
}

async function ResultadoBusca({ q }: { q: string }) {
  const inicial = await buscarPorNome(q, 1);

  if (inicial.filmes.length === 0) {
    return <p className="py-20 text-center text-apagado">Nenhum filme encontrado para essa busca.</p>;
  }

  return <ListaPaginada key={q} inicial={inicial} consulta={`q=${encodeURIComponent(q)}`} />;
}
