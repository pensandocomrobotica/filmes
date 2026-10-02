import { describe, expect, it } from "vitest";
import { FILTROS_PADRAO, filtrosParaQuery, lerFiltros } from "./filtros";
import type { Filtros } from "./tmdb/tipos";

describe("lerFiltros", () => {
  it("lê plataformas, gênero e ordem da URL", () => {
    expect(lerFiltros({ plataformas: "8,119", genero: "28", ordem: "avaliados" })).toEqual({
      plataformas: [8, 119],
      genero: 28,
      ordem: "avaliados",
    });
  });

  it("sem parâmetros, usa os filtros padrão", () => {
    expect(lerFiltros({})).toEqual(FILTROS_PADRAO);
    expect(FILTROS_PADRAO).toEqual({ plataformas: [], genero: null, ordem: "populares" });
  });

  it("descarta valores inválidos", () => {
    expect(lerFiltros({ plataformas: "8,abc,-3,8,119,1.5", genero: "abc", ordem: "xyz" })).toEqual({
      plataformas: [8, 119],
      genero: null,
      ordem: "populares",
    });
  });

  it("parâmetro repetido: usa o primeiro valor", () => {
    expect(lerFiltros({ genero: ["12", "28"] }).genero).toBe(12);
  });
});

describe("filtrosParaQuery", () => {
  it("escreve os filtros na ordem plataformas, gênero, ordem", () => {
    const q = filtrosParaQuery({ plataformas: [8, 119], genero: 28, ordem: "recentes" });
    expect(decodeURIComponent(q)).toBe("plataformas=8,119&genero=28&ordem=recentes");
  });

  it("filtros padrão resultam em query vazia", () => {
    expect(filtrosParaQuery(FILTROS_PADRAO)).toBe("");
  });

  it.each<Filtros>([
    { plataformas: [8], genero: null, ordem: "populares" },
    { plataformas: [], genero: 35, ordem: "avaliados" },
    { plataformas: [8, 119, 337], genero: 28, ordem: "recentes" },
  ])("ida e volta preserva os filtros (%o)", (f) => {
    const volta = lerFiltros(Object.fromEntries(new URLSearchParams(filtrosParaQuery(f))));
    expect(volta).toEqual(f);
  });
});
