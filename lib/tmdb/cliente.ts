// Único lugar que faz requisições ao TMDB. A chave (TMDB_TOKEN) só existe no servidor:
// nunca importe este arquivo em um componente com "use client".

const BASE = "https://api.themoviedb.org/3";
const TEMPO_LIMITE_MS = 8000;

export type StatusErroTmdb = number | "timeout" | "rede";

export class ErroTmdb extends Error {
  constructor(public status: StatusErroTmdb) {
    super(`Falha ao consultar o TMDB (${status})`);
    this.name = "ErroTmdb";
  }
}

export type Parametros = Record<string, string | number | undefined>;

export async function tmdbGet<T>(
  caminho: string,
  params: Parametros = {},
  opcoes: { revalidate?: number } = {},
): Promise<T> {
  const token = process.env.TMDB_TOKEN;
  if (!token) throw new Error("TMDB_TOKEN não configurado. Defina a variável em .env.local.");

  const busca = new URLSearchParams({ language: "pt-BR" });
  for (const [nome, valor] of Object.entries(params)) {
    if (valor !== undefined) busca.set(nome, String(valor));
  }

  // `next.revalidate` é o cache do Next.js; fora do Next essa chave é simplesmente ignorada.
  const init = {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    next: { revalidate: opcoes.revalidate },
  } as RequestInit;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}?${busca}`, init);
  } catch (e) {
    const nome = (e as { name?: string })?.name;
    throw new ErroTmdb(nome === "TimeoutError" || nome === "AbortError" ? "timeout" : "rede");
  }

  if (!resposta.ok) {
    if (resposta.status === 401) {
      console.error("TMDB respondeu 401: o TMDB_TOKEN é inválido ou expirou.");
    }
    throw new ErroTmdb(resposta.status);
  }

  return (await resposta.json()) as T;
}
