// Converte os filtros do catálogo para a URL e de volta.
// Ex.: /?plataformas=8,119&genero=28&ordem=recentes

import type { Filtros, Ordem } from "./tmdb/tipos";

export type ParametrosUrl = Record<string, string | string[] | undefined>;

export const FILTROS_PADRAO: Filtros = { plataformas: [], genero: null, ordem: "populares" };

const ORDENS: Ordem[] = ["populares", "avaliados", "recentes"];

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function inteiroPositivo(texto: string): number | null {
  const n = Number(texto);
  return /^\d+$/.test(texto.trim()) && n > 0 ? n : null;
}

export function lerFiltros(params: ParametrosUrl): Filtros {
  const plataformas = (primeiro(params.plataformas) ?? "")
    .split(",")
    .map(inteiroPositivo)
    .filter((n): n is number => n !== null);

  const genero = inteiroPositivo(primeiro(params.genero) ?? "");
  const ordem = primeiro(params.ordem) as Ordem;

  return {
    plataformas: [...new Set(plataformas)],
    genero,
    ordem: ORDENS.includes(ordem) ? ordem : FILTROS_PADRAO.ordem,
  };
}

export function filtrosParaQuery(filtros: Filtros): string {
  const busca = new URLSearchParams();
  if (filtros.plataformas.length) busca.set("plataformas", filtros.plataformas.join(","));
  if (filtros.genero !== null) busca.set("genero", String(filtros.genero));
  if (filtros.ordem !== FILTROS_PADRAO.ordem) busca.set("ordem", filtros.ordem);
  return busca.toString();
}
