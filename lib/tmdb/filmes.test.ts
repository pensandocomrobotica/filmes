import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErroTmdb, tmdbGet } from "./cliente";
import { buscarCatalogo, buscarPorNome, detalhesDoFilme, listarGeneros, listarPlataformas } from "./filmes";

vi.mock("./cliente", async (importOriginal) => {
  const original = await importOriginal<typeof import("./cliente")>();
  return { ...original, tmdbGet: vi.fn() };
});

const get = vi.mocked(tmdbGet);
const paginaVazia = { page: 1, total_pages: 1, results: [] };

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue(paginaVazia);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buscarCatalogo", () => {
  it("monta os parâmetros do discover com plataformas, gênero e página", async () => {
    await buscarCatalogo({ plataformas: [8, 119], genero: 28, ordem: "populares" }, 2);

    expect(get).toHaveBeenCalledWith(
      "/discover/movie",
      expect.objectContaining({
        with_watch_providers: "8|119",
        watch_region: "BR",
        with_watch_monetization_types: "flatrate",
        with_genres: 28,
        sort_by: "popularity.desc",
        page: 2,
      }),
      { revalidate: 21600 },
    );
  });

  it("sem plataformas, busca em qualquer streaming por assinatura", async () => {
    await buscarCatalogo({ plataformas: [], genero: null, ordem: "populares" });
    const params = get.mock.calls[0][1]!;
    expect(params.with_watch_providers).toBeUndefined();
    expect(params.with_genres).toBeUndefined();
    expect(params.with_watch_monetization_types).toBe("flatrate");
    expect(params.page).toBe(1);
  });

  it("mais bem avaliados exige pelo menos 200 votos", async () => {
    await buscarCatalogo({ plataformas: [], genero: null, ordem: "avaliados" });
    expect(get.mock.calls[0][1]).toMatchObject({ sort_by: "vote_average.desc", "vote_count.gte": 200 });
  });

  it("mais recentes não inclui filmes que ainda não estrearam", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    await buscarCatalogo({ plataformas: [], genero: null, ordem: "recentes" });
    expect(get.mock.calls[0][1]).toMatchObject({
      sort_by: "primary_release_date.desc",
      "primary_release_date.lte": "2026-10-02",
    });
  });

  it("converte o resultado", async () => {
    get.mockResolvedValueOnce({
      page: 1,
      total_pages: 900,
      results: [{ id: 1, title: "X", poster_path: null, vote_average: 7, vote_count: 3, release_date: "2020-01-01" }],
    });
    const r = await buscarCatalogo({ plataformas: [], genero: null, ordem: "populares" });
    expect(r).toEqual({ pagina: 1, totalPaginas: 500, filmes: [{ id: 1, titulo: "X", poster: null, nota: 7, ano: 2020 }] });
  });
});

describe("buscarPorNome", () => {
  it("busca pelo nome sem espaços extras e sem filmes adultos", async () => {
    await buscarPorNome("  matrix ", 1);
    expect(get).toHaveBeenCalledWith(
      "/search/movie",
      expect.objectContaining({ query: "matrix", include_adult: "false", page: 1 }),
      { revalidate: 3600 },
    );
  });

  it("consulta vazia não chama o TMDB", async () => {
    expect(await buscarPorNome("   ")).toEqual({ filmes: [], pagina: 1, totalPaginas: 0 });
    expect(get).not.toHaveBeenCalled();
  });
});

describe("detalhesDoFilme", () => {
  const detalhesCru = {
    id: 603,
    title: "Matrix",
    poster_path: null,
    vote_average: 8.2,
    vote_count: 100,
    release_date: "1999-03-31",
    overview: "",
    runtime: 136,
    backdrop_path: null,
    genres: [],
  };

  it("busca detalhes, elenco, vídeos e onde assistir numa chamada só", async () => {
    get.mockResolvedValueOnce(detalhesCru);
    const r = await detalhesDoFilme(603);
    expect(get).toHaveBeenCalledWith(
      "/movie/603",
      expect.objectContaining({
        append_to_response: "credits,videos,watch/providers",
        include_video_language: "pt,en",
      }),
      { revalidate: 21600 },
    );
    expect(r?.titulo).toBe("Matrix");
  });

  it("filme inexistente (404) devolve null", async () => {
    get.mockRejectedValueOnce(new ErroTmdb(404));
    expect(await detalhesDoFilme(999999999)).toBeNull();
  });

  it("outros erros são repassados", async () => {
    get.mockRejectedValueOnce(new ErroTmdb(500));
    await expect(detalhesDoFilme(603)).rejects.toBeInstanceOf(ErroTmdb);
  });

  it.each([NaN, -1, 0, 1.5])("id inválido (%s) devolve null sem chamar o TMDB", async (id) => {
    expect(await detalhesDoFilme(id)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});

describe("listarPlataformas", () => {
  it("lista as 12 principais plataformas do Brasil", async () => {
    get.mockResolvedValueOnce({
      results: Array.from({ length: 20 }, (_, i) => ({
        provider_id: i,
        provider_name: `P${i}`,
        logo_path: null,
        display_priority: i,
      })),
    });
    const r = await listarPlataformas();
    expect(get).toHaveBeenCalledWith("/watch/providers/movie", { watch_region: "BR" }, { revalidate: 86400 });
    expect(r).toHaveLength(12);
    expect(r[0].id).toBe(0);
  });
});

describe("listarGeneros", () => {
  it("lista os gêneros de filmes", async () => {
    get.mockResolvedValueOnce({ genres: [{ id: 28, name: "Ação" }] });
    expect(await listarGeneros()).toEqual([{ id: 28, nome: "Ação" }]);
    expect(get).toHaveBeenCalledWith("/genre/movie/list", {}, { revalidate: 86400 });
  });
});
