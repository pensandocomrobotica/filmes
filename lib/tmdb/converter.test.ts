import { describe, expect, it } from "vitest";
import {
  converterDetalhes,
  converterFilme,
  converterGeneros,
  converterPaginaFilmes,
  converterPlataformas,
} from "./converter";
import type { DetalhesTmdb, FilmeTmdb, PlataformaTmdb } from "./tipos-tmdb";

const filmeCru: FilmeTmdb = {
  id: 1,
  title: "X",
  poster_path: "/p.jpg",
  vote_average: 7.86,
  vote_count: 10,
  release_date: "2024-05-01",
};

function plataforma(id: number, prioridade: number): PlataformaTmdb {
  return { provider_id: id, provider_name: `P${id}`, logo_path: `/l${id}.png`, display_priority: prioridade };
}

function detalhesCru(extra: Partial<DetalhesTmdb> = {}): DetalhesTmdb {
  return {
    ...filmeCru,
    overview: "Sinopse",
    runtime: 130,
    backdrop_path: "/b.jpg",
    genres: [{ id: 28, name: "Ação" }],
    credits: { cast: [] },
    videos: { results: [] },
    ...extra,
  };
}

describe("converterFilme", () => {
  it("converte os campos e arredonda a nota para uma casa", () => {
    expect(converterFilme(filmeCru)).toEqual({ id: 1, titulo: "X", poster: "/p.jpg", nota: 7.9, ano: 2024 });
  });

  it("sem votos, a nota é null", () => {
    expect(converterFilme({ ...filmeCru, vote_count: 0 }).nota).toBeNull();
  });

  it("data vazia ou ausente resulta em ano null", () => {
    expect(converterFilme({ ...filmeCru, release_date: "" }).ano).toBeNull();
    expect(converterFilme({ ...filmeCru, release_date: undefined }).ano).toBeNull();
  });

  it("filme sem pôster tem poster null", () => {
    expect(converterFilme({ ...filmeCru, poster_path: null }).poster).toBeNull();
  });
});

describe("converterPaginaFilmes", () => {
  it("limita o total de páginas a 500", () => {
    const r = converterPaginaFilmes({ page: 2, total_pages: 900, results: [filmeCru] });
    expect(r).toEqual({ pagina: 2, totalPaginas: 500, filmes: [converterFilme(filmeCru)] });
  });

  it("mantém totais menores que 500", () => {
    expect(converterPaginaFilmes({ page: 1, total_pages: 3, results: [] }).totalPaginas).toBe(3);
  });
});

describe("converterGeneros", () => {
  it("converte id e nome", () => {
    expect(converterGeneros({ genres: [{ id: 28, name: "Ação" }] })).toEqual([{ id: 28, nome: "Ação" }]);
  });
});

describe("converterPlataformas", () => {
  it("ordena por prioridade crescente", () => {
    const r = converterPlataformas({ results: [plataforma(1, 5), plataforma(2, 1), plataforma(3, 3)] });
    expect(r.map((p) => p.id)).toEqual([2, 3, 1]);
    expect(r[0]).toEqual({ id: 2, nome: "P2", logo: "/l2.png", prioridade: 1 });
  });

  it("usa a prioridade do Brasil quando o TMDB a informa", () => {
    const r = converterPlataformas({
      results: [
        { ...plataforma(3, 2), display_priorities: { BR: 30, US: 1 } },
        { ...plataforma(1899, 40), display_priorities: { BR: 8 } },
        { ...plataforma(8, 0), display_priorities: { BR: 0 } },
      ],
    });
    expect(r.map((p) => p.id)).toEqual([8, 1899, 3]);
    expect(r[1].prioridade).toBe(8);
  });
});

describe("converterDetalhes", () => {
  it("prefere o trailer do YouTube em português", () => {
    const r = converterDetalhes(
      detalhesCru({
        videos: {
          results: [
            { site: "YouTube", type: "Teaser", iso_639_1: "pt", key: "t" },
            { site: "YouTube", type: "Trailer", iso_639_1: "en", key: "en1" },
            { site: "YouTube", type: "Trailer", iso_639_1: "pt", key: "pt1" },
          ],
        },
      }),
    );
    expect(r.trailerYoutube).toBe("pt1");
  });

  it("sem trailer em português, usa o em inglês", () => {
    const r = converterDetalhes(
      detalhesCru({ videos: { results: [{ site: "YouTube", type: "Trailer", iso_639_1: "en", key: "en1" }] } }),
    );
    expect(r.trailerYoutube).toBe("en1");
  });

  it("trailers fora do YouTube são ignorados", () => {
    const r = converterDetalhes(
      detalhesCru({ videos: { results: [{ site: "Vimeo", type: "Trailer", iso_639_1: "pt", key: "v" }] } }),
    );
    expect(r.trailerYoutube).toBeNull();
  });

  it("elenco: as 10 primeiras pessoas pela ordem de crédito", () => {
    const cast = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      name: `Ator ${i}`,
      character: `Papel ${i}`,
      profile_path: null,
      order: 14 - i,
    }));
    const r = converterDetalhes(detalhesCru({ credits: { cast } }));
    expect(r.elenco).toHaveLength(10);
    expect(r.elenco[0]).toEqual({ id: 14, nome: "Ator 14", personagem: "Papel 14", foto: null });
    expect(r.elenco[9].id).toBe(5);
  });

  it("sem dados de onde assistir, as listas ficam vazias", () => {
    const vazio = { assinatura: [], aluguel: [], compra: [], link: null };
    expect(converterDetalhes(detalhesCru()).ondeAssistir).toEqual(vazio);
    expect(converterDetalhes(detalhesCru({ "watch/providers": { results: {} } })).ondeAssistir).toEqual(vazio);
  });

  it("separa assinatura, aluguel e compra, cada um ordenado por prioridade", () => {
    const r = converterDetalhes(
      detalhesCru({
        "watch/providers": {
          results: {
            BR: {
              link: "https://www.themoviedb.org/movie/1/watch?locale=BR",
              flatrate: [plataforma(8, 5), plataforma(119, 2)],
              rent: [plataforma(2, 1)],
              buy: [plataforma(3, 1)],
            },
          },
        },
      }),
    );
    expect(r.ondeAssistir.assinatura.map((p) => p.id)).toEqual([119, 8]);
    expect(r.ondeAssistir.aluguel.map((p) => p.id)).toEqual([2]);
    expect(r.ondeAssistir.compra.map((p) => p.id)).toEqual([3]);
    expect(r.ondeAssistir.link).toBe("https://www.themoviedb.org/movie/1/watch?locale=BR");
  });

  it("duração 0 vira null e os demais campos são convertidos", () => {
    const r = converterDetalhes(detalhesCru({ runtime: 0 }));
    expect(r.duracao).toBeNull();
    expect(r).toMatchObject({
      id: 1,
      titulo: "X",
      sinopse: "Sinopse",
      fundo: "/b.jpg",
      generos: [{ id: 28, nome: "Ação" }],
    });
  });
});
