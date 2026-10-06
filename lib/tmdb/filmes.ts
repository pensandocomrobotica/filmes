// Funções que as páginas usam para obter dados de filmes.

import { ErroTmdb, tmdbGet, type Parametros } from "./cliente";
import {
  converterDetalhes,
  converterGeneros,
  converterPaginaFilmes,
  converterPlataformas,
} from "./converter";
import type { DetalhesFilme, Filtros, Genero, Ordem, PaginaFilmes, Plataforma } from "./tipos";
import type { DetalhesTmdb, GeneroTmdb, PaginaTmdb, PlataformaTmdb } from "./tipos-tmdb";

const REGIAO = "BR";

// Tempo de cache de cada tipo de consulta, em segundos.
const CACHE = {
  catalogo: 6 * 60 * 60,
  detalhes: 6 * 60 * 60,
  plataformas: 24 * 60 * 60,
  generos: 24 * 60 * 60,
  busca: 60 * 60,
};

function hojeNoBrasil(): string {
  // "en-CA" formata a data como AAAA-MM-DD.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function parametrosDeOrdem(ordem: Ordem): Parametros {
  switch (ordem) {
    case "avaliados":
      return { sort_by: "vote_average.desc", "vote_count.gte": 200 };
    case "recentes":
      return { sort_by: "primary_release_date.desc", "primary_release_date.lte": hojeNoBrasil() };
    default:
      return { sort_by: "popularity.desc" };
  }
}

export async function buscarCatalogo(filtros: Filtros, pagina = 1): Promise<PaginaFilmes> {
  const cru = await tmdbGet<PaginaTmdb>(
    "/discover/movie",
    {
      watch_region: REGIAO,
      with_watch_monetization_types: "flatrate",
      // "|" significa "ou": filmes em qualquer uma das plataformas escolhidas.
      with_watch_providers: filtros.plataformas.length ? filtros.plataformas.join("|") : undefined,
      with_genres: filtros.genero ?? undefined,
      ...parametrosDeOrdem(filtros.ordem),
      page: pagina,
    },
    { revalidate: CACHE.catalogo },
  );
  return converterPaginaFilmes(cru);
}

export async function buscarPorNome(q: string, pagina = 1): Promise<PaginaFilmes> {
  const consulta = q.trim();
  if (!consulta) return { filmes: [], pagina: 1, totalPaginas: 0 };

  const cru = await tmdbGet<PaginaTmdb>(
    "/search/movie",
    { query: consulta, include_adult: "false", page: pagina },
    { revalidate: CACHE.busca },
  );
  return converterPaginaFilmes(cru);
}

export async function detalhesDoFilme(id: number): Promise<DetalhesFilme | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  try {
    const cru = await tmdbGet<DetalhesTmdb>(
      `/movie/${id}`,
      { append_to_response: "credits,videos,watch/providers", include_video_language: "pt,en" },
      { revalidate: CACHE.detalhes },
    );
    return converterDetalhes(cru);
  } catch (e) {
    if (e instanceof ErroTmdb && e.status === 404) return null;
    throw e;
  }
}

export async function listarPlataformas(limite = 12): Promise<Plataforma[]> {
  const cru = await tmdbGet<{ results: PlataformaTmdb[] }>(
    "/watch/providers/movie",
    { watch_region: REGIAO },
    { revalidate: CACHE.plataformas },
  );
  return converterPlataformas(cru).slice(0, limite);
}

export async function listarGeneros(): Promise<Genero[]> {
  const cru = await tmdbGet<{ genres: GeneroTmdb[] }>("/genre/movie/list", {}, { revalidate: CACHE.generos });
  return converterGeneros(cru);
}
