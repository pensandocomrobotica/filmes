# Catálogo de Filmes em Streaming — Fase 1: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir e publicar um site Next.js que lista os filmes disponíveis em streaming no Brasil (via TMDB), com filtros, busca, detalhes e favoritos no navegador.

**Architecture:** Páginas do Next.js (App Router) renderizadas no servidor buscam dados por meio de um módulo isolado `lib/tmdb/`, o único que conhece a API do TMDB e a chave secreta. O "Carregar mais" roda no navegador e chama a rota interna `/api/filmes`. Os favoritos ficam atrás de uma API assíncrona em `lib/favoritos.ts` (localStorage agora, Supabase na Fase 2).

**Tech Stack:** Next.js (App Router, versão `latest`), TypeScript, Tailwind CSS, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-02-catalogo-filmes-fase1-design.md`

## Global Constraints

- Node.js 20.9 ou superior; npm como gerenciador de pacotes.
- O projeto fica na raiz do repositório `filmes/`, sem pasta `src/`; alias de import `@/*` → raiz.
- Região `watch_region=BR`; idioma `language=pt-BR` em **toda** chamada ao TMDB.
- Base da API: `https://api.themoviedb.org/3`. Autenticação: header `Authorization: Bearer ${process.env.TMDB_TOKEN}`.
- A variável é `TMDB_TOKEN`. **Nunca** usar o prefixo `NEXT_PUBLIC_`, e nunca importar `lib/tmdb/cliente.ts` em componente com `"use client"`.
- Tempo limite de cada chamada ao TMDB: 8 s (`AbortSignal.timeout(8000)`).
- Cache (segundos): catálogo 21600, detalhes 21600, plataformas 86400, gêneros 86400, busca 3600.
- Imagens: `https://image.tmdb.org/t/p/{tamanho}{caminho}`; `w342` na grade, `w500` no detalhe, `w1280` no fundo, `w185` no elenco, `w92` nos logos.
- `/discover` é limitado a 500 páginas: `totalPaginas = Math.min(total_pages, 500)`.
- Identificadores do código e textos da interface em português.
- Textos fixos da interface (copiar literalmente):
  - `Não conseguimos carregar os filmes agora` / botão `Tentar novamente`
  - `Filme não encontrado` / link `Voltar ao catálogo`
  - `Nenhum filme encontrado com esses filtros` / botão `Limpar filtros`
  - `Não disponível em streaming no Brasil no momento`
  - `Digite o nome de um filme`
  - `Carregar mais`
  - Rodapé: `This product uses the TMDB API but is not endorsed or certified by TMDB.` e `Dados de disponibilidade: JustWatch`
- Commits terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Filmes repetidos no "Carregar mais"**: a ordem por popularidade muda entre requisições e o TMDB pode devolver o mesmo filme em duas páginas. A grade deve continuar sem duplicatas (`anexarSemDuplicar`, Task 8).
2. **ID de filme inválido na URL** (`/filme/abc`, `/filme/-1`, `/filme/1.5`) deve mostrar "Filme não encontrado" sem chamar o TMDB (Task 4).
3. **localStorage corrompido ou bloqueado**: JSON inválido ou `localStorage` lançando exceção não podem quebrar a página; o resultado é tratado como lista vazia ou memória da sessão (Task 6).
4. **Busca com acentos e símbolos** (`ação & aventura`, `Amélie`) precisa ser codificada corretamente na URL do TMDB e na `/api/filmes` (Tasks 3 e 8).
5. **"Mais recentes" mostrando filmes que ainda não estrearam**: a ordenação por data deve limitar `primary_release_date.lte` à data de hoje (Task 4).

---

### Task 1: Criar o projeto, configurar testes e utilitário de imagens

**Files:**
- Create: projeto Next.js na raiz; `vitest.config.ts`; `.env.example`; `.env.local` (não versionado)
- Create: `lib/tmdb/tipos.ts`, `lib/tmdb/imagens.ts`
- Modify: `next.config.ts`, `package.json`
- Test: `lib/tmdb/imagens.test.ts`

**Interfaces:**
- Produces, em `lib/tmdb/tipos.ts` (usado por todas as tasks):

```ts
export type Filme = { id: number; titulo: string; poster: string | null; nota: number | null; ano: number | null };
export type PaginaFilmes = { filmes: Filme[]; pagina: number; totalPaginas: number };
export type Genero = { id: number; nome: string };
export type Plataforma = { id: number; nome: string; logo: string | null; prioridade: number };
export type PessoaElenco = { id: number; nome: string; personagem: string; foto: string | null };
export type OndeAssistir = { assinatura: Plataforma[]; aluguel: Plataforma[]; compra: Plataforma[]; link: string | null };
export type DetalhesFilme = Filme & {
  sinopse: string; duracao: number | null; generos: Genero[]; fundo: string | null;
  trailerYoutube: string | null; elenco: PessoaElenco[]; ondeAssistir: OndeAssistir;
};
export type Ordem = 'populares' | 'avaliados' | 'recentes';
export type Filtros = { plataformas: number[]; genero: number | null; ordem: Ordem };
```

- Produces: `urlImagem(caminho: string | null, tamanho: 'w92' | 'w185' | 'w342' | 'w500' | 'w1280'): string | null` em `lib/tmdb/imagens.ts`.

- [ ] **Step 1: Criar o projeto Next.js.** A pasta já contém `docs/` e `.git`, então o `create-next-app` recusaria usá-la diretamente. Crie numa subpasta temporária e mova o conteúdo:

```bash
npx create-next-app@latest tmp-app --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

Mova todo o conteúdo de `tmp-app/` para a raiz, incluindo os arquivos ocultos (`.gitignore` etc.), e apague `tmp-app/`. Se a pasta tiver um `.git` próprio, apague-o antes de mover.
Expected: `npm run dev` abre a página padrão em http://localhost:3000.

- [ ] **Step 2: Configurar o Vitest.** Rode `npm i -D vitest` e adicione o script `"test": "vitest run"` ao `package.json`. Crie `vitest.config.ts` com `environment: 'node'` e alias `@` → raiz do projeto.

- [ ] **Step 3: Configurar imagens e variáveis de ambiente.**
  - Em `next.config.ts`, permita imagens de `image.tmdb.org`, caminho `/t/p/**` (`images.remotePatterns`), e defina `images.unoptimized: true`. O TMDB já entrega as imagens nos tamanhos certos, e o plano gratuito da Vercel limita a otimização.
  - Crie `.env.example` contendo `TMDB_TOKEN=`.
  - Confirme que `.env*.local` está no `.gitignore`.
  - **Ação do autor:** criar conta em themoviedb.org, copiar o *API Read Access Token* (Settings → API) e colocá-lo em `.env.local`.

- [ ] **Step 4: Escrever o teste que falha**, em `lib/tmdb/imagens.test.ts`:

```ts
expect(urlImagem('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
expect(urlImagem(null, 'w500')).toBeNull();
```

- [ ] **Step 5: Rodar o teste.** Run: `npm test`. Expected: FAIL (módulo não encontrado).

- [ ] **Step 6: Implementar `tipos.ts` (como acima) e `urlImagem`.**

- [ ] **Step 7: Rodar os testes.** Run: `npm test`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: cria projeto Next.js com Vitest, tipos e utilitário de imagens"
```

---

### Task 2: Conversão das respostas do TMDB

**Files:**
- Create: `lib/tmdb/tipos-tmdb.ts` (formato cru das respostas), `lib/tmdb/converter.ts`
- Test: `lib/tmdb/converter.test.ts`

**Interfaces:**
- Consumes: tipos de `lib/tmdb/tipos.ts`.
- Produces, em `converter.ts`:
  - `converterFilme(cru: FilmeTmdb): Filme`
  - `converterPaginaFilmes(cru: PaginaTmdb): PaginaFilmes`
  - `converterGeneros(cru: { genres: GeneroTmdb[] }): Genero[]`
  - `converterPlataformas(cru: { results: PlataformaTmdb[] }): Plataforma[]`
  - `converterDetalhes(cru: DetalhesTmdb): DetalhesFilme`
- Os tipos `*Tmdb` espelham a documentação do TMDB. Use apenas os campos lidos aqui: `id`, `title`, `poster_path`, `vote_average`, `vote_count`, `release_date`, `page`, `total_pages`, `results`, `genres`, `provider_id`, `provider_name`, `logo_path`, `display_priority`, `overview`, `runtime`, `backdrop_path`, `credits.cast[]` (`id`, `name`, `character`, `profile_path`, `order`), `videos.results[]` (`key`, `site`, `type`, `iso_639_1`) e `"watch/providers".results.BR` (`link`, `flatrate`, `rent`, `buy`).

- [ ] **Step 1: Escrever os testes que falham**, com objetos crus mínimos montados no próprio teste:
  - `converterFilme`:
    - `{ id: 1, title: 'X', poster_path: '/p.jpg', vote_average: 7.86, vote_count: 10, release_date: '2024-05-01' }` → `{ id: 1, titulo: 'X', poster: '/p.jpg', nota: 7.9, ano: 2024 }`
    - `vote_count: 0` → `nota: null`
    - `release_date: ''` ou ausente → `ano: null`
    - `poster_path: null` → `poster: null`
  - `converterPaginaFilmes`: `total_pages: 900` → `totalPaginas: 500`; `total_pages: 3` → `3`; `page` vira `pagina`.
  - `converterPlataformas`: ordena por `display_priority` crescente.
  - `converterDetalhes`, trailer:
    - com vídeos `[{site:'YouTube',type:'Teaser',iso_639_1:'pt',key:'t'}, {site:'YouTube',type:'Trailer',iso_639_1:'en',key:'en1'}, {site:'YouTube',type:'Trailer',iso_639_1:'pt',key:'pt1'}]` → `trailerYoutube: 'pt1'`
    - só com trailer `en` → a chave dele
    - só com trailers fora do YouTube → `null`
  - `converterDetalhes`, elenco: 15 pessoas fora de ordem → as 10 primeiras por `order`.
  - `converterDetalhes`, onde assistir:
    - sem `"watch/providers"` ou sem `BR` → `{ assinatura: [], aluguel: [], compra: [], link: null }`
    - `flatrate`, `rent` e `buy` vão para `assinatura`, `aluguel` e `compra`, cada lista ordenada por prioridade
  - `converterDetalhes`, duração: `runtime: 0` → `duracao: null`.

- [ ] **Step 2: Rodar.** Run: `npm test -- converter`. Expected: FAIL.

- [ ] **Step 3: Implementar `tipos-tmdb.ts` e as funções de `converter.ts`.** Nota arredondada com `Math.round(v * 10) / 10`. Trailer: entre os vídeos com `site === 'YouTube'` e `type === 'Trailer'`, a preferência é `pt`, depois `en`, depois qualquer um.

- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.

- [ ] **Step 5: Commit** — `feat: converte respostas do TMDB para tipos próprios`

---

### Task 3: Cliente HTTP do TMDB

**Files:**
- Create: `lib/tmdb/cliente.ts`
- Test: `lib/tmdb/cliente.test.ts`

**Interfaces:**
- Produces:
  - `class ErroTmdb extends Error { status: number | 'timeout' | 'rede' }`
  - `tmdbGet<T>(caminho: string, params?: Record<string, string | number | undefined>, opcoes?: { revalidate?: number }): Promise<T>`
- Comportamento:
  - Monta `https://api.themoviedb.org/3${caminho}` e acrescenta `language=pt-BR` e os `params`, ignorando os `undefined` (`URLSearchParams`).
  - Envia o header Bearer.
  - Passa `{ next: { revalidate } }` no `init` do `fetch`. Fora do Next essa chave é ignorada, então o módulo continua reaproveitável.
  - Usa `signal: AbortSignal.timeout(8000)`.

- [ ] **Step 1: Escrever os testes que falham**, com `vi.stubGlobal('fetch', ...)` e `vi.stubEnv('TMDB_TOKEN', 'tok')`:
  - `envia token e parametros`: a URL chamada contém `/3/discover/movie?`, `language=pt-BR` e `page=2` e não contém `genero`. O header `Authorization` é `Bearer tok`.
  - `codifica acentos e simbolos`: `params { query: 'ação & aventura' }` → `new URL(urlChamada).searchParams.get('query') === 'ação & aventura'`.
  - `401`: rejeita com `ErroTmdb` de `status: 401`, e `console.error` é chamado com uma mensagem que contém `TMDB_TOKEN`.
  - `404`: `status: 404`.
  - `500`: `status: 500`.
  - `timeout`: o fetch rejeita com `new DOMException('x', 'TimeoutError')` → `status: 'timeout'`.
  - `falha de rede`: o fetch rejeita com `TypeError` → `status: 'rede'`.
  - `sem token`: com `TMDB_TOKEN` vazio, rejeita com uma mensagem que contém `TMDB_TOKEN não configurado`.

- [ ] **Step 2: Rodar.** Run: `npm test -- cliente`. Expected: FAIL.
- [ ] **Step 3: Implementar `tmdbGet` e `ErroTmdb`.**
- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: cliente HTTP do TMDB com tratamento de erros`

---

### Task 4: Funções de alto nível (`filmes.ts`)

**Files:**
- Create: `lib/tmdb/filmes.ts`
- Test: `lib/tmdb/filmes.test.ts`

**Interfaces:**
- Consumes: `tmdbGet` e `ErroTmdb` (Task 3); conversores (Task 2); `Filtros`, `Ordem` (Task 1).
- Produces:
  - `buscarCatalogo(filtros: Filtros, pagina?: number): Promise<PaginaFilmes>`
  - `buscarPorNome(q: string, pagina?: number): Promise<PaginaFilmes>`
  - `detalhesDoFilme(id: number): Promise<DetalhesFilme | null>`: `null` = filme não encontrado
  - `listarPlataformas(limite?: number): Promise<Plataforma[]>`: limite padrão 12
  - `listarGeneros(): Promise<Genero[]>`

- [ ] **Step 1: Escrever os testes que falham.** Use `vi.mock('./cliente')` para controlar o `tmdbGet` e inspecionar os argumentos.
  - `buscarCatalogo({ plataformas: [8, 119], genero: 28, ordem: 'populares' }, 2)` chama `/discover/movie` com:
    - `with_watch_providers: '8|119'`, `watch_region: 'BR'`, `with_watch_monetization_types: 'flatrate'`
    - `with_genres: 28`, `sort_by: 'popularity.desc'`, `page: 2`
    - `{ revalidate: 21600 }`
  - Sem plataformas: `with_watch_providers` fica `undefined`, e `with_watch_monetization_types` continua `'flatrate'`.
  - `ordem: 'avaliados'` → `sort_by: 'vote_average.desc'` e `'vote_count.gte': 200`.
  - `ordem: 'recentes'` → `sort_by: 'primary_release_date.desc'` e `'primary_release_date.lte'` igual à data de hoje no formato `YYYY-MM-DD`. Use `vi.setSystemTime(new Date('2026-10-02T12:00:00Z'))` e espere `'2026-10-02'`.
  - `buscarPorNome('  matrix ', 1)` → `/search/movie` com `query: 'matrix'`, `include_adult: 'false'` e `{ revalidate: 3600 }`.
  - `buscarPorNome('   ')` → `{ filmes: [], pagina: 1, totalPaginas: 0 }`, sem chamar `tmdbGet`.
  - `detalhesDoFilme(603)` → `/movie/603` com `append_to_response: 'credits,videos,watch/providers'`, `include_video_language: 'pt,en'` e `{ revalidate: 21600 }`.
  - `detalhesDoFilme` com `tmdbGet` rejeitando `ErroTmdb` de status 404 → `null`. Com status 500 → rejeita.
  - `detalhesDoFilme(NaN)`, `(-1)`, `(0)` e `(1.5)` → `null`, sem chamar `tmdbGet`.
  - `listarPlataformas()` → `/watch/providers/movie` com `watch_region: 'BR'` e `{ revalidate: 86400 }`. Com 20 itens na resposta, devolve 12.
  - `listarGeneros()` → `/genre/movie/list` com `{ revalidate: 86400 }`.

- [ ] **Step 2: Rodar.** Run: `npm test -- filmes`. Expected: FAIL.
- [ ] **Step 3: Implementar.** As funções montam os parâmetros, chamam `tmdbGet` e passam o resultado pelo conversor correspondente.
- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: funções de catálogo, busca, detalhes, plataformas e gêneros`

---

### Task 5: Filtros ⇄ URL

**Files:**
- Create: `lib/filtros.ts`
- Test: `lib/filtros.test.ts`

**Interfaces:**
- Produces:
  - `FILTROS_PADRAO: Filtros`, que vale `{ plataformas: [], genero: null, ordem: 'populares' }`
  - `lerFiltros(params: Record<string, string | string[] | undefined>): Filtros`
  - `filtrosParaQuery(filtros: Filtros): string`, sem `?`. Omite os valores padrão. Ordem dos parâmetros: `plataformas`, `genero`, `ordem`.

- [ ] **Step 1: Escrever os testes que falham:**
  - `lerFiltros({ plataformas: '8,119', genero: '28', ordem: 'avaliados' })` → `{ plataformas: [8, 119], genero: 28, ordem: 'avaliados' }`
  - `lerFiltros({})` → `FILTROS_PADRAO`
  - Valores inválidos descartados:
    - `plataformas: '8,abc,-3,8,119'` → `[8, 119]` (só inteiros positivos, sem repetir)
    - `genero: 'abc'` → `null`
    - `ordem: 'xyz'` → `'populares'`
  - Parâmetro em array: `{ genero: ['12', '28'] }` → `genero: 12` (usa o primeiro)
  - `filtrosParaQuery({ plataformas: [8, 119], genero: 28, ordem: 'recentes' })` → `'plataformas=8%2C119&genero=28&ordem=recentes'` (aceite também a vírgula sem codificar, desde que a volta funcione)
  - `filtrosParaQuery(FILTROS_PADRAO)` → `''`
  - Ida e volta: `lerFiltros(Object.fromEntries(new URLSearchParams(filtrosParaQuery(f))))` é igual a `f` para três combinações diferentes.

- [ ] **Step 2: Rodar.** Run: `npm test -- filtros`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: leitura e escrita de filtros na URL`

---

### Task 6: Favoritos no navegador

**Files:**
- Create: `lib/favoritos.ts`
- Test: `lib/favoritos.test.ts`

**Interfaces:**
- Consumes: `Filme`.
- Produces (todas assíncronas, para a Fase 2 trocar a implementação para Supabase sem mudar quem chama):
  - `type Lista = 'favoritos' | 'quero-assistir'`
  - `type ItemFavorito = { id: number; titulo: string; poster: string | null; nota: number | null; lista: Lista; adicionadoEm: string }`
  - `listarFavoritos(lista?: Lista): Promise<ItemFavorito[]>`: mais recentes primeiro
  - `adicionarFavorito(filme: Filme, lista: Lista): Promise<void>`
  - `removerFavorito(id: number, lista: Lista): Promise<void>`
  - `eFavorito(id: number, lista: Lista): Promise<boolean>`
- Chave no localStorage: `catalogo-filmes:favoritos`.
- Se o `localStorage` não existir ou lançar exceção, os dados ficam num array em memória.

- [ ] **Step 1: Escrever os testes que falham.** Use um `localStorage` falso via `vi.stubGlobal` e limpe-o no `beforeEach`.
  - Adicionar e listar: o item tem `adicionadoEm` em ISO.
  - Adicionar o mesmo filme duas vezes na mesma lista → um item só.
  - O mesmo filme pode estar em `favoritos` e em `quero-assistir` → `listarFavoritos()` traz 2 itens e `listarFavoritos('favoritos')` traz 1.
  - Remover só da lista indicada.
  - `eFavorito` é verdadeiro depois de adicionar e falso depois de remover.
  - JSON corrompido salvo na chave → `listarFavoritos()` resolve `[]`, e adicionar em seguida funciona.
  - Com `localStorage.getItem` e `setItem` lançando exceção → adicionar e listar continuam funcionando na mesma execução, sem lançar.
  - Sem `localStorage` global (`vi.stubGlobal('localStorage', undefined)`) → mesmo comportamento.

- [ ] **Step 2: Rodar.** Run: `npm test -- favoritos`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: favoritos e quero assistir no localStorage`

---

### Task 7: Estrutura visual comum (layout, cabeçalho, rodapé, cartões, erros)

**Files:**
- Create: `lib/formatar.ts`, `lib/formatar.test.ts`
- Create: `components/Cabecalho.tsx`, `components/Rodape.tsx`, `components/CartaoFilme.tsx`, `components/GradeFilmes.tsx`, `components/EsqueletoGrade.tsx`
- Create: `app/error.tsx`, `app/loading.tsx`
- Create: `public/sem-poster.svg`, `public/tmdb-logo.svg`
- Modify: `app/layout.tsx`, `app/page.tsx` (página temporária com dados de teste)

**Interfaces:**
- Consumes: `Filme`, `urlImagem`.
- Produces:
  - `formatarNota(nota: number | null): string`
  - `formatarDuracao(minutos: number | null): string`
  - `<CartaoFilme filme={Filme} />`: link para `/filme/{id}`
  - `<GradeFilmes filmes={Filme[]} />`: 2 colunas no celular, até 6 no computador
  - `<EsqueletoGrade quantidade?={number} />`: padrão 12
  - `<Cabecalho />`
  - `<Rodape />`

- [ ] **Step 1: Teste que falha para `formatar.ts`:**
  - `formatarNota(7.8)` → `'7,8'`; `formatarNota(8)` → `'8,0'`; `formatarNota(null)` → `'—'`
  - `formatarDuracao(130)` → `'2h 10min'`; `formatarDuracao(45)` → `'45min'`; `formatarDuracao(120)` → `'2h'`; `formatarDuracao(null)` → `''`

- [ ] **Step 2: Rodar.** Run: `npm test -- formatar`. Expected: FAIL. Depois implemente e rode de novo. Expected: PASS.

- [ ] **Step 3: Criar os componentes.**
  - **`app/layout.tsx`:** `lang="pt-BR"`, título "Catálogo de Filmes", `<Cabecalho />` em cima e `<Rodape />` embaixo.
  - **Cabeçalho:**
    - logo/nome com link para `/`
    - `<form action="/busca">` com `<input name="q">`, que funciona sem JavaScript
    - link ☆ para `/favoritos`
  - **Rodapé:** `tmdb-logo.svg` + os dois textos fixos das Global Constraints. O logo oficial vem de https://www.themoviedb.org/about/logos-attribution.
  - **CartaoFilme:**
    - `next/image` com `urlImagem(poster, 'w342')`, ou `/sem-poster.svg` quando não houver
    - título e `★ {formatarNota(nota)}`
  - **`app/error.tsx`** (`"use client"`):
    - mostra `Não conseguimos carregar os filmes agora`
    - botão `Tentar novamente` executa `startTransition(() => { router.refresh(); reset(); })`
  - **`app/loading.tsx`:** renderiza `<EsqueletoGrade />`.

- [ ] **Step 4: Verificação manual.**
  - Monte um `app/page.tsx` temporário com 3 filmes de exemplo, sendo um com `poster: null` e outro com `nota: null`, e rode `npm run dev`.
  - Expected: grade com 3 cartões, o filme sem pôster com a imagem genérica, a nota `—`, rodapé com os créditos e a busca levando a `/busca?q=...` (404 por enquanto).
  - Em largura de celular (DevTools, 375 px), a grade mostra 2 colunas.

- [ ] **Step 5: Rodar.** Run: `npm test && npm run lint && npm run build`. Expected: tudo passa.
- [ ] **Step 6: Commit** — `feat: layout, cabeçalho, rodapé e grade de filmes`

---

### Task 8: Página do catálogo com filtros e "Carregar mais"

**Files:**
- Create: `lib/paginacao.ts`, `lib/paginacao.test.ts`
- Create: `app/api/filmes/route.ts`, `app/api/filmes/route.test.ts`
- Create: `components/BarraFiltros.tsx` (client), `components/ListaPaginada.tsx` (client)
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `buscarCatalogo`, `buscarPorNome`, `listarPlataformas`, `listarGeneros` (Task 4); `lerFiltros`, `filtrosParaQuery`, `FILTROS_PADRAO` (Task 5); `GradeFilmes` (Task 7).
- Produces:
  - `anexarSemDuplicar(atuais: Filme[], novos: Filme[]): Filme[]`: mantém a ordem e descarta de `novos` os `id` já presentes
  - `lerPagina(valor: string | null): number`: inteiro de 1 a 500; qualquer outro valor vira 1
  - `GET /api/filmes?{query}&pagina=N` → `200 { filmes: Filme[], pagina: number, totalPaginas: number }`. Com o parâmetro `q`, usa `buscarPorNome`; sem ele, `buscarCatalogo(lerFiltros(...))`. Em `ErroTmdb` → `502 { erro: 'Não conseguimos carregar os filmes agora' }`.
  - `<ListaPaginada inicial={PaginaFilmes} consulta={string} />`: `consulta` é a query sem `pagina`, por exemplo `plataformas=8&ordem=recentes` ou `q=am%C3%A9lie`.
  - `<BarraFiltros plataformas={Plataforma[]} generos={Genero[]} filtros={Filtros} />`

- [ ] **Step 1: Testes que falham:**
  - `anexarSemDuplicar([A, B], [B, C])` → `[A, B, C]`
  - `lerPagina('3')` → 3; `lerPagina('abc')` → 1; `lerPagina('0')` → 1; `lerPagina('999')` → 1; `lerPagina(null)` → 1
  - `route.test.ts` (com `vi.mock('@/lib/tmdb/filmes')`):
    - `GET(new Request('http://x/api/filmes?plataformas=8&pagina=2'))` chama `buscarCatalogo({ plataformas: [8], genero: null, ordem: 'populares' }, 2)` e responde 200
    - `?q=am%C3%A9lie&pagina=2` chama `buscarPorNome('amélie', 2)`
    - quando `buscarCatalogo` rejeita `ErroTmdb` → status 502 com o JSON `erro`

- [ ] **Step 2: Rodar.** Run: `npm test -- paginacao route`. Expected: FAIL.

- [ ] **Step 3: Implementar `paginacao.ts` e `route.ts`.**

- [ ] **Step 4: Rodar.** Run: `npm test`. Expected: PASS.

- [ ] **Step 5: Implementar a página e os componentes.**
  - **`app/page.tsx`** (Server Component):
    - lê os filtros com `lerFiltros(await searchParams)`
    - busca em paralelo `buscarCatalogo(filtros, 1)`, `listarPlataformas()` e `listarGeneros()`
  - **`BarraFiltros`:**
    - botões de plataforma com logo `w92` que alternam a seleção
    - `<select>` de gênero (opção "Todos os gêneros") e de ordem ("Mais populares" / "Mais bem avaliados" / "Mais recentes")
    - cada mudança faz `router.push('/?' + filtrosParaQuery(novos))`
  - **Sem resultados:** mostra `Nenhum filme encontrado com esses filtros` + botão `Limpar filtros` (→ `/`).
  - **`ListaPaginada`:**
    - guarda a lista em estado e mostra `Carregar mais` enquanto `pagina < totalPaginas`
    - faz `fetch('/api/filmes?' + consulta + '&pagina=' + (pagina + 1))` e junta o resultado com `anexarSemDuplicar`
    - em caso de erro, mostra `Não conseguimos carregar os filmes agora` abaixo da grade, com `Tentar novamente`, mantendo os filmes já exibidos
    - na página, renderize com `key={consulta}` para que trocar o filtro reinicie a lista

- [ ] **Step 6: Verificação manual** (`npm run dev`, com `TMDB_TOKEN` em `.env.local`):
  - `/` mostra 20 filmes.
  - Clicar em Netflix e depois em Prime faz a URL virar `?plataformas=8%2C119` (ou `8,119`), e a grade muda.
  - "Carregar mais" traz mais filmes sem repetir.
  - Depois de carregar 3 páginas, trocar o gênero volta a mostrar só 20 filmes.
  - O botão "voltar" do navegador restaura o filtro anterior.
  - `/?genero=abc` funciona como "todos os gêneros".
  - Na aba Rede do DevTools, nenhuma requisição do navegador vai para `api.themoviedb.org`, e o token não aparece em nenhuma resposta.

- [ ] **Step 7: Rodar.** Run: `npm test && npm run lint && npm run build`. Expected: tudo passa.
- [ ] **Step 8: Commit** — `feat: catálogo com filtros na URL e carregar mais`

---

### Task 9: Página de detalhes do filme

**Files:**
- Create: `app/filme/[id]/page.tsx`, `app/filme/[id]/not-found.tsx`
- Create: `components/OndeAssistir.tsx`, `components/Trailer.tsx`, `components/Elenco.tsx`, `components/BotaoFavorito.tsx` (client)

**Interfaces:**
- Consumes: `detalhesDoFilme` (Task 4); `adicionarFavorito`, `removerFavorito`, `eFavorito`, `Lista` (Task 6); `formatarNota`, `formatarDuracao` (Task 7).
- Produces: `<BotaoFavorito filme={Filme} lista={Lista} rotulo={string} />`, reutilizado na Task 11.

- [ ] **Step 1: Implementar a página.**
  - **Carregamento:** `const filme = await detalhesDoFilme(Number(id))`; se vier `null`, chama `notFound()`.
  - **`generateMetadata`:** título da aba = título do filme.
  - **Topo:**
    - fundo `w1280` e pôster `w500`
    - título, ano, `formatarDuracao`, gêneros e `★ formatarNota`
    - `BotaoFavorito` com o rótulo "Favorito" e outro com "Quero assistir"
  - **Onde assistir:** seção `OndeAssistir` com os grupos "Assinatura", "Aluguel" e "Compra".
    - Cada grupo vazio é omitido.
    - Se os três estiverem vazios, mostra `Não disponível em streaming no Brasil no momento`.
    - Os logos linkam para `ondeAssistir.link` quando ele existir.
  - **Sinopse:** quando vazia, mostra "Sinopse indisponível.".
  - **Trailer:** `<iframe src="https://www.youtube-nocookie.com/embed/{chave}">` com proporção 16:9; omitido se `null`.
  - **Elenco:** fileira rolável com foto `w185` (ou `sem-poster.svg`), nome e personagem; omitido se vazio.
  - **`not-found.tsx`:** `Filme não encontrado` + link `Voltar ao catálogo` (→ `/`).
  - **`BotaoFavorito`:** consulta `eFavorito` ao montar e alterna entre ☆ e ★ ao clicar.

- [ ] **Step 2: Verificação manual:**
  - `/filme/603` (Matrix) mostra todas as seções, o trailer toca e o "Onde assistir" aparece.
  - Marcar "Favorito" e recarregar a página mantém a ★.
  - `/filme/abc` e `/filme/999999999` mostram "Filme não encontrado".
  - Num filme antigo ou obscuro sem streaming, aparece a mensagem de indisponível.
  - Clicar num cartão do catálogo leva à página de detalhes.

- [ ] **Step 3: Rodar.** Run: `npm test && npm run lint && npm run build`. Expected: tudo passa.
- [ ] **Step 4: Commit** — `feat: página de detalhes com onde assistir, trailer e elenco`

---

### Task 10: Página de busca

**Files:**
- Create: `app/busca/page.tsx`

**Interfaces:**
- Consumes: `buscarPorNome` (Task 4); `ListaPaginada` (Task 8).

- [ ] **Step 1: Implementar.**
  - Lê `q` de `searchParams`; se vier em array, usa o primeiro valor.
  - Com `q` vazio ou só espaços: mostra `Digite o nome de um filme`, sem chamar o TMDB.
  - Caso contrário:
    - título `Resultados para "{q}"`
    - `<ListaPaginada inicial={...} consulta={'q=' + encodeURIComponent(q.trim())} key={q} />`
    - sem resultados: "Nenhum filme encontrado para essa busca."
  - O campo de busca do cabeçalho vem preenchido com o `q` atual: o `Cabecalho` lê `useSearchParams` num subcomponente client, envolvido em `<Suspense>`.

- [ ] **Step 2: Verificação manual:**
  - `/busca?q=matrix` lista os filmes Matrix e o "Carregar mais" funciona.
  - Buscar `Amélie` e `ação & aventura` não dá erro e traz resultados coerentes.
  - `/busca` e `/busca?q=%20` mostram `Digite o nome de um filme`.

- [ ] **Step 3: Rodar.** Run: `npm test && npm run lint && npm run build`. Expected: tudo passa.
- [ ] **Step 4: Commit** — `feat: página de busca por nome`

---

### Task 11: Página de favoritos

**Files:**
- Create: `app/favoritos/page.tsx` (página com um componente client `components/ListasFavoritos.tsx`)

**Interfaces:**
- Consumes: `listarFavoritos`, `ItemFavorito` (Task 6); `GradeFilmes` (Task 7); `BotaoFavorito` (Task 9).

- [ ] **Step 1: Implementar.**
  - **`ListasFavoritos`:**
    - ao montar, carrega `listarFavoritos()`
    - mostra as seções "Favoritos" e "Quero assistir", cada uma com uma `GradeFilmes`
    - converte `ItemFavorito` em `Filme` com `ano: null`
  - **Lista vazia:** "Nenhum filme aqui ainda." + link "Explorar o catálogo" (→ `/`).
  - **Carregamento:** mostra `EsqueletoGrade` enquanto carrega, para evitar que o HTML do servidor e o do navegador fiquem diferentes.

- [ ] **Step 2: Verificação manual:**
  - Os filmes marcados na Task 9 aparecem na seção certa.
  - Desmarcar na página de detalhes e voltar faz o filme sumir.
  - Numa janela anônima as duas listas aparecem vazias, com o link.

- [ ] **Step 3: Rodar.** Run: `npm test && npm run lint && npm run build`. Expected: tudo passa.
- [ ] **Step 4: Commit** — `feat: página de favoritos e quero assistir`

---

### Task 12: README e publicação na Vercel

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Escrever o `README.md`** (em português):
  - descrição e captura de tela (`docs/screenshot.png`)
  - link do site no ar (preenchido no Step 3)
  - tecnologias
  - como rodar: `npm install`, copiar `.env.example` para `.env.local` com o token, `npm run dev`, `npm test`
  - créditos ao TMDB (com o texto fixo) e ao JustWatch
  - as próximas fases

- [ ] **Step 2: Publicar o código** (ação do autor): criar um repositório público no GitHub e enviar o código com `git remote add origin ...` e `git push -u origin main`.

- [ ] **Step 3: Publicar o site** (ação do autor):
  - Em vercel.com, faça "Add New Project", importe o repositório e defina `TMDB_TOKEN` em Environment Variables.
  - Faça o deploy e coloque a URL no README.

- [ ] **Step 4: Verificação no site publicado:**
  - catálogo, filtros, detalhes, busca e favoritos funcionam
  - o token não aparece no código-fonte da página nem na aba Rede
  - o rodapé exibe os créditos

- [ ] **Step 5: Commit** — `docs: README com instruções e link do site`
