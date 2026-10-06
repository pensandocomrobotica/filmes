// Formato cru das respostas do TMDB (só os campos que o app lê).
// Referência: https://developer.themoviedb.org/reference

export type FilmeTmdb = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
};

export type PaginaTmdb = {
  page: number;
  total_pages: number;
  results: FilmeTmdb[];
};

export type GeneroTmdb = { id: number; name: string };

export type PlataformaTmdb = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  // Prioridade por país (vem na lista geral de plataformas).
  display_priorities?: Record<string, number>;
};

export type PessoaElencoTmdb = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type VideoTmdb = {
  key: string;
  site: string;
  type: string;
  iso_639_1: string;
};

export type OndeAssistirTmdb = {
  link?: string;
  flatrate?: PlataformaTmdb[];
  rent?: PlataformaTmdb[];
  buy?: PlataformaTmdb[];
};

export type DetalhesTmdb = FilmeTmdb & {
  overview: string;
  runtime: number | null;
  backdrop_path: string | null;
  genres: GeneroTmdb[];
  credits?: { cast: PessoaElencoTmdb[] };
  videos?: { results: VideoTmdb[] };
  "watch/providers"?: { results: Record<string, OndeAssistirTmdb | undefined> };
};
