import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErroTmdb, tmdbGet } from "./cliente";

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchFalso = vi.fn(async () => respostaJson({ ok: true }));
  vi.stubGlobal("fetch", fetchFalso);
  vi.stubEnv("TMDB_TOKEN", "tok");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function urlChamada(): URL {
  return new URL(fetchFalso.mock.calls[0][0] as string);
}

async function erroDe(promessa: Promise<unknown>): Promise<ErroTmdb> {
  try {
    await promessa;
  } catch (e) {
    return e as ErroTmdb;
  }
  throw new Error("era esperado um erro");
}

describe("tmdbGet", () => {
  it("envia token e parametros", async () => {
    const r = await tmdbGet("/discover/movie", { page: 2, genero: undefined }, { revalidate: 60 });

    expect(r).toEqual({ ok: true });
    const url = urlChamada();
    expect(url.href).toContain("https://api.themoviedb.org/3/discover/movie?");
    expect(url.searchParams.get("language")).toBe("pt-BR");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("genero")).toBe(false);
    const init = fetchFalso.mock.calls[0][1] as RequestInit & { next?: { revalidate?: number } };
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
    expect(init.next).toEqual({ revalidate: 60 });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("codifica acentos e simbolos", async () => {
    await tmdbGet("/search/movie", { query: "ação & aventura" });
    expect(urlChamada().searchParams.get("query")).toBe("ação & aventura");
  });

  it("401: erro com status e aviso no servidor sobre o token", async () => {
    fetchFalso.mockResolvedValueOnce(respostaJson({}, 401));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const erro = await erroDe(tmdbGet("/x"));

    expect(erro).toBeInstanceOf(ErroTmdb);
    expect(erro.status).toBe(401);
    expect(String(log.mock.calls[0][0])).toContain("TMDB_TOKEN");
  });

  it("404: erro com status 404", async () => {
    fetchFalso.mockResolvedValueOnce(respostaJson({}, 404));
    expect((await erroDe(tmdbGet("/movie/1"))).status).toBe(404);
  });

  it("500: erro com status 500", async () => {
    fetchFalso.mockResolvedValueOnce(respostaJson({}, 500));
    expect((await erroDe(tmdbGet("/x"))).status).toBe(500);
  });

  it("tempo esgotado: status timeout", async () => {
    fetchFalso.mockRejectedValueOnce(new DOMException("x", "TimeoutError"));
    expect((await erroDe(tmdbGet("/x"))).status).toBe("timeout");
  });

  it("falha de rede: status rede", async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await erroDe(tmdbGet("/x"))).status).toBe("rede");
  });

  it("sem token: avisa que o TMDB_TOKEN não está configurado", async () => {
    vi.stubEnv("TMDB_TOKEN", "");
    await expect(tmdbGet("/x")).rejects.toThrow("TMDB_TOKEN não configurado");
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
