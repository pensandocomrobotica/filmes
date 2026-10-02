// Favoritos e "Quero assistir".
// Fase 1: guardados no navegador (localStorage). Na Fase 2 só este arquivo muda
// para usar o Supabase; por isso todas as funções já são assíncronas.

import type { Filme } from "./tmdb/tipos";

export type Lista = "favoritos" | "quero-assistir";

export type ItemFavorito = {
  id: number;
  titulo: string;
  poster: string | null;
  nota: number | null;
  lista: Lista;
  adicionadoEm: string;
};

const CHAVE = "catalogo-filmes:favoritos";

// Cópia em memória: usada quando o localStorage não existe ou está bloqueado.
let memoria: ItemFavorito[] = [];

function ler(): ItemFavorito[] {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE);
    if (texto === undefined) return memoria;
    if (texto === null) return [];
    const dados: unknown = JSON.parse(texto);
    return Array.isArray(dados) ? (dados as ItemFavorito[]) : [];
  } catch (e) {
    // JSON corrompido: começa do zero. Armazenamento bloqueado: usa a memória.
    return e instanceof SyntaxError ? [] : memoria;
  }
}

function salvar(itens: ItemFavorito[]): void {
  memoria = itens;
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // Sem armazenamento disponível: os dados ficam só nesta sessão.
  }
}

export async function listarFavoritos(lista?: Lista): Promise<ItemFavorito[]> {
  return ler()
    .filter((item) => !lista || item.lista === lista)
    .sort((a, b) => b.adicionadoEm.localeCompare(a.adicionadoEm));
}

export async function adicionarFavorito(filme: Filme, lista: Lista): Promise<void> {
  const itens = ler();
  if (itens.some((item) => item.id === filme.id && item.lista === lista)) return;
  salvar([
    ...itens,
    {
      id: filme.id,
      titulo: filme.titulo,
      poster: filme.poster,
      nota: filme.nota,
      lista,
      adicionadoEm: new Date().toISOString(),
    },
  ]);
}

export async function removerFavorito(id: number, lista: Lista): Promise<void> {
  salvar(ler().filter((item) => !(item.id === id && item.lista === lista)));
}

export async function eFavorito(id: number, lista: Lista): Promise<boolean> {
  return ler().some((item) => item.id === id && item.lista === lista);
}
