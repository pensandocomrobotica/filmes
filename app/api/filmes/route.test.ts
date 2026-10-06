import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroTmdb } from "@/lib/tmdb/cliente";
import { buscarCatalogo, buscarPorNome } from "@/lib/tmdb/filmes";
import { GET } from "./route";

vi.mock("@/lib/tmdb/filmes", () => ({ buscarCatalogo: vi.fn(), buscarPorNome: vi.fn() }));

const pagina = { filmes: [], pagina: 2, totalPaginas: 5 };

beforeEach(() => {
  vi.mocked(buscarCatalogo).mockReset().mockResolvedValue(pagina);
  vi.mocked(buscarPorNome).mockReset().mockResolvedValue(pagina);
});

describe("GET /api/filmes", () => {
  it("sem q, busca o catálogo com os filtros da URL", async () => {
    const r = await GET(new Request("http://x/api/filmes?plataformas=8&pagina=2"));
    expect(buscarCatalogo).toHaveBeenCalledWith({ plataformas: [8], genero: null, ordem: "populares" }, 2);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual(pagina);
  });

  it("com q, busca por nome (com acentos)", async () => {
    await GET(new Request("http://x/api/filmes?q=am%C3%A9lie&pagina=2"));
    expect(buscarPorNome).toHaveBeenCalledWith("amélie", 2);
    expect(buscarCatalogo).not.toHaveBeenCalled();
  });

  it("página inválida vira 1", async () => {
    await GET(new Request("http://x/api/filmes?pagina=abc"));
    expect(buscarCatalogo).toHaveBeenCalledWith(expect.anything(), 1);
  });

  it("falha do TMDB responde 502 com mensagem", async () => {
    vi.mocked(buscarCatalogo).mockRejectedValueOnce(new ErroTmdb(500));
    const r = await GET(new Request("http://x/api/filmes"));
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ erro: "Não conseguimos carregar os filmes agora" });
  });
});
