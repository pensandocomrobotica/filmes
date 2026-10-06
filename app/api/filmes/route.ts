// Rota interna usada pelo botão "Carregar mais".
// O navegador chama /api/filmes e o servidor fala com o TMDB, mantendo a chave escondida.

import { lerFiltros } from "@/lib/filtros";
import { lerPagina } from "@/lib/paginacao";
import { buscarCatalogo, buscarPorNome } from "@/lib/tmdb/filmes";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const pagina = lerPagina(params.get("pagina"));
  const q = params.get("q");

  try {
    const resultado =
      q !== null
        ? await buscarPorNome(q, pagina)
        : await buscarCatalogo(lerFiltros(Object.fromEntries(params)), pagina);
    return Response.json(resultado);
  } catch (e) {
    console.error(e);
    return Response.json({ erro: "Não conseguimos carregar os filmes agora" }, { status: 502 });
  }
}
