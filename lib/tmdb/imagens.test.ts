import { describe, expect, it } from "vitest";
import { urlImagem } from "./imagens";

describe("urlImagem", () => {
  it("monta a URL da imagem no tamanho pedido", () => {
    expect(urlImagem("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });

  it("devolve null quando o filme não tem imagem", () => {
    expect(urlImagem(null, "w500")).toBeNull();
  });
});
