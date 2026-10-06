import type { Filme } from "./tmdb/tipos";

const PAGINA_MAXIMA = 500;

// O TMDB pode devolver o mesmo filme em duas páginas (a popularidade muda entre
// uma requisição e outra). Esta função evita filmes repetidos na grade.
export function anexarSemDuplicar(atuais: Filme[], novos: Filme[]): Filme[] {
  const vistos = new Set(atuais.map((f) => f.id));
  const resultado = [...atuais];
  for (const filme of novos) {
    if (vistos.has(filme.id)) continue;
    vistos.add(filme.id);
    resultado.push(filme);
  }
  return resultado;
}

export function lerPagina(valor: string | null): number {
  if (!valor || !/^\d+$/.test(valor)) return 1;
  const n = Number(valor);
  return n >= 1 && n <= PAGINA_MAXIMA ? n : 1;
}
