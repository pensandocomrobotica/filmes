export type TamanhoImagem = "w92" | "w185" | "w342" | "w500" | "w1280";

export function urlImagem(caminho: string | null, tamanho: TamanhoImagem): string | null {
  if (!caminho) return null;
  return `https://image.tmdb.org/t/p/${tamanho}${caminho}`;
}
