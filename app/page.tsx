import Link from "next/link";
import { Suspense } from "react";
import BarraFiltros from "@/components/BarraFiltros";
import EsqueletoGrade from "@/components/EsqueletoGrade";
import ListaPaginada from "@/components/ListaPaginada";
import { filtrosParaQuery, lerFiltros } from "@/lib/filtros";
import { buscarCatalogo, listarGeneros, listarPlataformas } from "@/lib/tmdb/filmes";
import type { Filtros } from "@/lib/tmdb/tipos";

export default async function Catalogo({ searchParams }: PageProps<"/">) {
  const filtros = lerFiltros(await searchParams);
  const consulta = filtrosParaQuery(filtros);
  const [plataformas, generos] = await Promise.all([listarPlataformas(), listarGeneros()]);

  return (
    <>
      <BarraFiltros plataformas={plataformas} generos={generos} filtros={filtros} />
      {/* A key faz a grade recomeçar (com esqueleto) sempre que os filtros mudam. */}
      <Suspense key={consulta} fallback={<EsqueletoGrade />}>
        <ResultadoCatalogo filtros={filtros} consulta={consulta} />
      </Suspense>
    </>
  );
}

async function ResultadoCatalogo({ filtros, consulta }: { filtros: Filtros; consulta: string }) {
  const inicial = await buscarCatalogo(filtros, 1);

  if (inicial.filmes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg">Nenhum filme encontrado com esses filtros</p>
        <Link href="/" className="rounded-full bg-destaque px-5 py-2 font-medium text-background hover:opacity-90">
          Limpar filtros
        </Link>
      </div>
    );
  }

  return <ListaPaginada key={consulta} inicial={inicial} consulta={consulta} />;
}
