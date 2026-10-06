// Transforma as respostas cruas do TMDB nos tipos próprios do app.
// Se o TMDB mudar algum formato, só este arquivo precisa ser ajustado.

import type { DetalhesFilme, Filme, Genero, PaginaFilmes, PessoaElenco, Plataforma } from "./tipos";
import type { DetalhesTmdb, FilmeTmdb, GeneroTmdb, PaginaTmdb, PlataformaTmdb, VideoTmdb } from "./tipos-tmdb";

const LIMITE_PAGINAS = 500;
const LIMITE_ELENCO = 10;

export function converterFilme(cru: FilmeTmdb): Filme {
  return {
    id: cru.id,
    titulo: cru.title,
    poster: cru.poster_path ?? null,
    nota: cru.vote_count > 0 ? Math.round(cru.vote_average * 10) / 10 : null,
    ano: cru.release_date ? Number(cru.release_date.slice(0, 4)) : null,
  };
}

export function converterPaginaFilmes(cru: PaginaTmdb): PaginaFilmes {
  return {
    filmes: cru.results.map(converterFilme),
    pagina: cru.page,
    totalPaginas: Math.min(cru.total_pages, LIMITE_PAGINAS),
  };
}

export function converterGeneros(cru: { genres: GeneroTmdb[] }): Genero[] {
  return cru.genres.map((g) => ({ id: g.id, nome: g.name }));
}

export function converterPlataformas(cru: { results: PlataformaTmdb[] }): Plataforma[] {
  return cru.results
    .map((p) => ({
      id: p.provider_id,
      nome: p.provider_name,
      logo: p.logo_path ?? null,
      // A ordem do Brasil reflete melhor as plataformas mais usadas aqui.
      prioridade: p.display_priorities?.BR ?? p.display_priority,
    }))
    .sort((a, b) => a.prioridade - b.prioridade);
}

function escolherTrailer(videos: VideoTmdb[]): string | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const escolhido =
    trailers.find((v) => v.iso_639_1 === "pt") ?? trailers.find((v) => v.iso_639_1 === "en") ?? trailers[0];
  return escolhido?.key ?? null;
}

function converterElenco(cru: DetalhesTmdb): PessoaElenco[] {
  return [...(cru.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, LIMITE_ELENCO)
    .map((p) => ({ id: p.id, nome: p.name, personagem: p.character, foto: p.profile_path ?? null }));
}

export function converterDetalhes(cru: DetalhesTmdb): DetalhesFilme {
  const br = cru["watch/providers"]?.results?.BR;
  return {
    ...converterFilme(cru),
    sinopse: cru.overview ?? "",
    duracao: cru.runtime || null,
    generos: converterGeneros({ genres: cru.genres ?? [] }),
    fundo: cru.backdrop_path ?? null,
    trailerYoutube: escolherTrailer(cru.videos?.results ?? []),
    elenco: converterElenco(cru),
    ondeAssistir: {
      assinatura: converterPlataformas({ results: br?.flatrate ?? [] }),
      aluguel: converterPlataformas({ results: br?.rent ?? [] }),
      compra: converterPlataformas({ results: br?.buy ?? [] }),
      link: br?.link ?? null,
    },
  };
}
