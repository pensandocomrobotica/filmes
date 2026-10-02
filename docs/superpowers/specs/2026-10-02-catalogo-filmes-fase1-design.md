# Catálogo de Filmes em Streaming — Fase 1 (Design)

**Data:** 2026-10-02
**Status:** aprovado em conversa, aguardando revisão do documento escrito

## 1. Contexto e objetivo

Projeto de **estudo e portfólio** de um desenvolvedor iniciante (HTML/CSS/JS básico) que quer aprender um framework moderno. O app é um catálogo dos filmes disponíveis em plataformas de streaming **no Brasil**, usando a API do TMDB.

**Critério de sucesso:** um site publicado, com link público, que o autor entende de ponta a ponta, e código organizado no GitHub, apresentável em portfólio.

### Fases do projeto

| Fase | Conteúdo | Coberta por este documento? |
|---|---|---|
| 1 | Catálogo, filtros, busca, detalhes, favoritos no navegador | **Sim** |
| 2 | Login (Supabase), favoritos na conta, avaliações 1–5 estrelas + comentário curto visíveis a todos | Não (spec própria) |
| 3 | App mobile reaproveitando a lógica de acesso ao TMDB | Não (spec própria) |

## 2. Escopo da Fase 1

**Inclui:**
- Catálogo em grade de filmes disponíveis por **assinatura** (flatrate) no Brasil
- Filtro por plataforma (múltipla escolha), por gênero (um por vez) e ordenação
- Busca por nome
- Página de detalhes: sinopse, elenco, trailer, onde assistir
- Favoritos e "Quero assistir" salvos no navegador (`localStorage`)

**Não inclui:** login, avaliações/comentários, app mobile, séries de TV, filtros por ano/duração/idioma.

## 3. Tecnologias

- **Next.js** (App Router) com **TypeScript**
- **Tailwind CSS** para estilos
- **Vitest** para testes de lógica
- **Vercel** para hospedagem (plano Hobby), com deploy automático a cada push
- **GitHub** para o código (repositório público)
- **Supabase**: reservado para a Fase 2; não usado na Fase 1
- Região `watch_region=BR`, idioma `language=pt-BR`

**Por que Vercel e não GitHub Pages:** o GitHub Pages só serve arquivos estáticos, o que impediria usar renderização no servidor e esconder a chave do TMDB. Na Vercel, a chave fica apenas no servidor do Next.js.

## 4. Arquitetura

```
Navegador ──► Next.js (Vercel, servidor) ──► API do TMDB
                  (chave secreta só aqui)
```

- As páginas são **Server Components**: o servidor busca os dados no TMDB e entrega o HTML pronto.
- O botão "Carregar mais" roda no navegador e chama a rota interna `GET /api/filmes`, que repassa a chamada ao TMDB pelo servidor. A chave nunca chega ao navegador.
- Respostas do TMDB ficam em **cache** do Next.js (`fetch` com `revalidate`) pelos tempos da tabela da seção 6.

### Estrutura de pastas

```
app/
  page.tsx               catálogo (/)
  filme/[id]/page.tsx    detalhes (/filme/123)
  filme/[id]/not-found.tsx
  busca/page.tsx         busca (/busca?q=...)
  favoritos/page.tsx     favoritos (/favoritos)
  api/filmes/route.ts    paginação do "Carregar mais" (catálogo: filtros + pagina;
                         busca: q + pagina); responde JSON com filmes e totalPaginas
  error.tsx              erro genérico com "Tentar novamente"
components/
  Cabecalho, BarraFiltros, GradeFilmes, CartaoFilme, EsqueletoGrade,
  OndeAssistir, Trailer, Elenco, BotaoFavorito, Rodape
lib/
  tmdb/
    cliente.ts           fetch, autenticação, tratamento de erro
    filmes.ts            buscarCatalogo, detalhesDoFilme, buscarPorNome,
                         listarPlataformas, listarGeneros
    tipos.ts             tipos próprios (Filme, DetalhesFilme, Plataforma, Genero...)
    converter.ts         resposta crua do TMDB → tipos próprios
  filtros.ts             filtros ⇄ parâmetros de URL
  favoritos.ts           API de favoritos (localStorage na Fase 1)
```

**Regras de fronteira:**
- Só `lib/tmdb/` conhece URLs, chave e formato de resposta do TMDB. Páginas e componentes usam apenas as funções de `filmes.ts` e os tipos de `tipos.ts`.
- `lib/tmdb/` não importa nada específico do Next.js, para poder ser reaproveitado na Fase 3. O cache é passado como opção do `fetch` pelo chamador ou por parâmetro, não codificado com APIs exclusivas do Next.
- Páginas usam favoritos só via `lib/favoritos.ts` (`listarFavoritos`, `adicionarFavorito`, `removerFavorito`, `eFavorito`). Na Fase 2 só esse arquivo muda.

## 5. Páginas

### 5.1 Catálogo (`/`), layout "filtros no topo + grade"
- **Cabeçalho:** logo, campo de busca, ícone ☆ → `/favoritos`.
- **Barra de filtros:**
  - botões de plataforma, com múltipla escolha; lista vinda de `/watch/providers/movie` para BR, ordenada por `display_priority`, mostrando as ~12 principais
  - menu de gênero
  - menu de ordenação: mais populares (`popularity.desc`), mais bem avaliados (`vote_average.desc` com `vote_count.gte=200`), mais recentes (`primary_release_date.desc`)
- **Estado na URL:** `/?plataformas=8,119&genero=28&ordem=populares`. Compartilhável, e o botão voltar funciona.
- **Sem plataforma selecionada:** mostra filmes disponíveis por assinatura em **qualquer** plataforma no Brasil (`with_watch_monetization_types=flatrate` sem `with_watch_providers`).
- **Grade:** pôster, título e nota (★, uma casa decimal). 2 colunas no celular, até 6 no computador.
- **"Carregar mais":** busca a próxima página (20 filmes) e anexa à grade; some quando não há mais páginas.

### 5.2 Detalhes (`/filme/[id]`)
- Imagem de fundo, pôster, título, ano, duração, gêneros, nota
- **Onde assistir:** logos separados em Assinatura / Aluguel / Compra; se não houver nada, mostra *"Não disponível em streaming no Brasil no momento"*
- Sinopse
- Trailer: primeiro vídeo do YouTube do tipo `Trailer`, de preferência em pt-BR, depois em inglês; seção oculta se não houver
- Elenco: até 10 pessoas, com foto e nome; seção oculta se vazio
- Botões "☆ Favorito" e "Quero assistir"

### 5.3 Busca (`/busca?q=...`)
- Usa `/search/movie` e o mesmo layout de grade, com "Carregar mais".
- **Não** filtra por plataforma, porque o TMDB não oferece isso na busca. A disponibilidade aparece na página de detalhes.
- Consulta vazia mostra a mensagem *"Digite o nome de um filme"*.

### 5.4 Favoritos (`/favoritos`)
- Duas seções: **Favoritos** e **Quero assistir**, em grade.
- Dados em `localStorage`, guardando só o essencial de cada filme: `id`, `titulo`, `poster`, `nota`, `lista` e `adicionadoEm`. Assim a página não precisa chamar o TMDB.
- Lista vazia mostra mensagem com link para o catálogo.

### 5.5 Rodapé (todas as páginas)
- Logo do TMDB e o texto "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Crédito "Dados de disponibilidade: JustWatch".

## 6. Chamadas ao TMDB

Todas com `language=pt-BR`; as que envolvem disponibilidade, com `watch_region=BR`. A autenticação usa o *API Read Access Token* (Bearer) da variável de ambiente `TMDB_TOKEN`.

| Função | Endpoint | Cache |
|---|---|---|
| `buscarCatalogo(filtros, pagina)` | `/discover/movie` (`with_watch_providers` com `\|`, `with_watch_monetization_types=flatrate`, `with_genres`, `sort_by`, `page`) | 6 h |
| `listarPlataformas()` | `/watch/providers/movie` | 24 h |
| `listarGeneros()` | `/genre/movie/list` | 24 h |
| `detalhesDoFilme(id)` | `/movie/{id}?append_to_response=credits,videos,watch/providers` | 6 h |
| `buscarPorNome(q, pagina)` | `/search/movie` | 1 h |

Imagens via `https://image.tmdb.org/t/p/{tamanho}{caminho}` (`w342` na grade, `w500` no detalhe, `w1280` no fundo), configuradas em `next.config` como domínio permitido do `next/image`. O `/discover` limita a paginação a 500 páginas; a interface não expõe isso.

## 7. Tratamento de erros

| Situação | Comportamento |
|---|---|
| TMDB fora do ar, erro 5xx ou demora maior que 8 s | `cliente.ts` lança um erro tipado; `error.tsx` mostra *"Não conseguimos carregar os filmes agora"* + "Tentar novamente" |
| Erro 401 (token inválido) | Mesmo aviso para o usuário; log claro no servidor indicando token inválido |
| Filme inexistente (404 do TMDB) | `notFound()` → página "Filme não encontrado" com link ao catálogo |
| Filtros sem resultados | *"Nenhum filme encontrado com esses filtros"* + "Limpar filtros" |
| Parâmetro de URL inválido | `filtros.ts` descarta o valor inválido; a página segue normalmente |
| Falha no "Carregar mais" | Mensagem curta abaixo da grade + botão para tentar de novo; os filmes já exibidos permanecem |
| Pôster, trailer ou elenco ausentes | Imagem genérica no lugar do pôster; seções vazias não são renderizadas |
| `localStorage` indisponível | Favoritos funcionam só na sessão atual, sem quebrar a página |
| Carregamento | `loading.tsx` com esqueletos cinzas na grade |

## 8. Testes (Vitest)

Testes de **lógica** sem chamadas reais ao TMDB:
- `converter.ts`: conversão correta; campos ausentes (pôster, nota, data) não quebram
- `filtros.ts`: ida e volta filtros ⇄ URL sem perda; descarta valores inválidos
- `favoritos.ts`: adicionar, remover, listar, não duplicar, separar as duas listas; `localStorage` simulado
- `cliente.ts`: com `fetch` simulado, trata 401, 404, 5xx e tempo esgotado

A interface é verificada manualmente rodando o site localmente (`npm run dev`).

## 9. Publicação e segredos

- Repositório público no GitHub, conectado à Vercel
- `TMDB_TOKEN` configurado como variável de ambiente na Vercel e em `.env.local` localmente, com `.env.local` no `.gitignore`; um `.env.example` documenta a variável sem valor
- README: descrição, captura de tela, link do site, tecnologias, como rodar localmente, créditos TMDB/JustWatch

## 10. Preparação para as próximas fases

- **Fase 2:** substituir a implementação de `lib/favoritos.ts` por Supabase (Auth + tabelas `favoritos` e `avaliacoes` com Row Level Security), sem mudar as páginas.
- **Fase 3:** reaproveitar `lib/tmdb/` no app mobile.
