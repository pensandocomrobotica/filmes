import { describe, expect, it } from "vitest";
import { anexarSemDuplicar, lerPagina } from "./paginacao";
import type { Filme } from "./tmdb/tipos";

const f = (id: number): Filme => ({ id, titulo: `F${id}`, poster: null, nota: null, ano: null });

describe("anexarSemDuplicar", () => {
  it("anexa os novos filmes sem repetir os que já estão na grade", () => {
    expect(anexarSemDuplicar([f(1), f(2)], [f(2), f(3)]).map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it("também remove repetições dentro da nova página", () => {
    expect(anexarSemDuplicar([f(1)], [f(3), f(3)]).map((x) => x.id)).toEqual([1, 3]);
  });
});

describe("lerPagina", () => {
  it.each([
    ["3", 3],
    ["500", 500],
    ["abc", 1],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    ["999", 1],
    [null, 1],
  ])("lerPagina(%s) = %s", (valor, esperado) => {
    expect(lerPagina(valor)).toBe(esperado);
  });
});
