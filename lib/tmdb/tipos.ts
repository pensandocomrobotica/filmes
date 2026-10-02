// Tipos próprios do app. As páginas usam só estes tipos, nunca o formato cru do TMDB.

export type Filme = {
  id: number;
  titulo: string;
  poster: string | null;
  nota: number | null;
  ano: number | null;
};

export type PaginaFilmes = {
  filmes: Filme[];
  pagina: number;
  totalPaginas: number;
};

export type Genero = { id: number; nome: string };

export type Plataforma = {
  id: number;
  nome: string;
  logo: string | null;
  prioridade: number;
};

export type PessoaElenco = {
  id: number;
  nome: string;
  personagem: string;
  foto: string | null;
};

export type OndeAssistir = {
  assinatura: Plataforma[];
  aluguel: Plataforma[];
  compra: Plataforma[];
  link: string | null;
};

export type DetalhesFilme = Filme & {
  sinopse: string;
  duracao: number | null;
  generos: Genero[];
  fundo: string | null;
  trailerYoutube: string | null;
  elenco: PessoaElenco[];
  ondeAssistir: OndeAssistir;
};

export type Ordem = "populares" | "avaliados" | "recentes";

export type Filtros = {
  plataformas: number[];
  genero: number | null;
  ordem: Ordem;
};
