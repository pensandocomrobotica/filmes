import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Filme } from "./tmdb/tipos";

const CHAVE = "catalogo-filmes:favoritos";

function armazenamentoFalso() {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
  };
}

const matrix: Filme = { id: 603, titulo: "Matrix", poster: "/m.jpg", nota: 8.2, ano: 1999 };
const amelie: Filme = { id: 194, titulo: "Amélie", poster: null, nota: 7.9, ano: 2001 };

// Cada teste importa o módulo do zero, para não herdar a memória de outro teste.
async function carregar() {
  vi.resetModules();
  return import("./favoritos");
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal("localStorage", armazenamentoFalso());
});

describe("favoritos", () => {
  it("adiciona e lista com a data em que foi adicionado", async () => {
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    const lista = await fav.listarFavoritos();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ id: 603, titulo: "Matrix", poster: "/m.jpg", nota: 8.2, lista: "favoritos" });
    expect(new Date(lista[0].adicionadoEm).toISOString()).toBe(lista[0].adicionadoEm);
  });

  it("não duplica o mesmo filme na mesma lista", async () => {
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    await fav.adicionarFavorito(matrix, "favoritos");
    expect(await fav.listarFavoritos()).toHaveLength(1);
  });

  it("o mesmo filme pode estar nas duas listas", async () => {
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    await fav.adicionarFavorito(matrix, "quero-assistir");
    expect(await fav.listarFavoritos()).toHaveLength(2);
    expect(await fav.listarFavoritos("favoritos")).toHaveLength(1);
  });

  it("lista os mais recentes primeiro", async () => {
    vi.useFakeTimers();
    const fav = await carregar();
    vi.setSystemTime(new Date("2026-10-01T10:00:00Z"));
    await fav.adicionarFavorito(matrix, "favoritos");
    vi.setSystemTime(new Date("2026-10-02T10:00:00Z"));
    await fav.adicionarFavorito(amelie, "favoritos");
    vi.useRealTimers();
    expect((await fav.listarFavoritos()).map((f) => f.id)).toEqual([194, 603]);
  });

  it("remove apenas da lista indicada", async () => {
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    await fav.adicionarFavorito(matrix, "quero-assistir");
    await fav.removerFavorito(603, "favoritos");
    const lista = await fav.listarFavoritos();
    expect(lista.map((f) => f.lista)).toEqual(["quero-assistir"]);
  });

  it("eFavorito acompanha adicionar e remover", async () => {
    const fav = await carregar();
    expect(await fav.eFavorito(603, "favoritos")).toBe(false);
    await fav.adicionarFavorito(matrix, "favoritos");
    expect(await fav.eFavorito(603, "favoritos")).toBe(true);
    expect(await fav.eFavorito(603, "quero-assistir")).toBe(false);
    await fav.removerFavorito(603, "favoritos");
    expect(await fav.eFavorito(603, "favoritos")).toBe(false);
  });

  it("persiste no localStorage e sobrevive a um novo carregamento", async () => {
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toHaveLength(1);
    const outro = await carregar();
    expect(await outro.eFavorito(603, "favoritos")).toBe(true);
  });

  it("dados corrompidos são tratados como lista vazia", async () => {
    localStorage.setItem(CHAVE, "{isso não é json");
    const fav = await carregar();
    expect(await fav.listarFavoritos()).toEqual([]);
    await fav.adicionarFavorito(matrix, "favoritos");
    expect(await fav.listarFavoritos()).toHaveLength(1);
  });

  it("JSON válido mas com formato errado também vira lista vazia", async () => {
    localStorage.setItem(CHAVE, '{"a":1}');
    const fav = await carregar();
    expect(await fav.listarFavoritos()).toEqual([]);
  });

  it("itens com formato inválido são descartados sem quebrar", async () => {
    const valido = { id: 603, titulo: "Matrix", poster: null, nota: 8.2, lista: "favoritos", adicionadoEm: "2026-10-02T10:00:00.000Z" };
    localStorage.setItem(
      CHAVE,
      JSON.stringify([null, 42, { id: 1 }, { ...valido, id: 2, lista: "outra" }, { ...valido, id: 3, adicionadoEm: undefined }, valido]),
    );
    const fav = await carregar();
    expect((await fav.listarFavoritos()).map((f) => f.id)).toEqual([603]);
    expect(await fav.eFavorito(1, "favoritos")).toBe(false);
    await fav.adicionarFavorito(amelie, "quero-assistir");
    expect(await fav.listarFavoritos()).toHaveLength(2);
  });

  it("localStorage que lança exceção: funciona em memória", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "favoritos");
    expect(await fav.listarFavoritos()).toHaveLength(1);
    expect(await fav.eFavorito(603, "favoritos")).toBe(true);
  });

  it("sem localStorage: funciona em memória", async () => {
    vi.stubGlobal("localStorage", undefined);
    const fav = await carregar();
    await fav.adicionarFavorito(matrix, "quero-assistir");
    expect(await fav.listarFavoritos("quero-assistir")).toHaveLength(1);
  });
});
