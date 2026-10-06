# 🎬 Catálogo de Filmes

Catálogo dos filmes disponíveis nas plataformas de streaming **no Brasil**: Netflix, Prime Video, Max, Disney+, Globoplay e outras. Os dados vêm da API do [TMDB](https://www.themoviedb.org).

Projeto de estudo e portfólio, construído com Next.js.

## Funcionalidades

- **Catálogo:** grade de filmes disponíveis por assinatura no Brasil, com pôster, título e nota
- **Filtros:**
  - por plataforma, com várias ao mesmo tempo
  - por gênero
  - ordenação por mais populares, mais bem avaliados ou mais recentes
  - os filtros ficam na URL, então o link pode ser compartilhado
- **Carregar mais:** paginação sem filmes repetidos
- **Busca** por nome
- **Página do filme:** sinopse, elenco, trailer e onde assistir (assinatura, aluguel e compra)
- **Favoritos e "Quero assistir":** salvos no navegador

## Tecnologias

- [Next.js](https://nextjs.org) (App Router, Server Components) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev) para testes da lógica
- Hospedagem na [Vercel](https://vercel.com)

## Como funciona

```
Navegador ──► Next.js (servidor) ──► API do TMDB
                (o token fica só aqui)
```

- As páginas são montadas no servidor, que é o único lugar com acesso ao token do TMDB.
- O botão "Carregar mais" chama a rota interna `/api/filmes`, então o token nunca chega ao navegador.

**Organização do código:**

| Pasta | Função |
|---|---|
| `app/` | Páginas: catálogo, filme, busca, favoritos |
| `components/` | Peças visuais reutilizáveis |
| `lib/tmdb/` | Único módulo que conversa com o TMDB |
| `lib/filtros.ts` | Filtros ⇄ URL |
| `lib/favoritos.ts` | Favoritos (localStorage) |

## Rodando localmente

Requisitos: Node.js 20.9 ou superior.

1. Crie uma conta em [themoviedb.org](https://www.themoviedb.org/signup).
2. Em **Settings → API**, copie o **API Read Access Token**.
3. Instale as dependências e configure o token:

   ```bash
   npm install
   cp .env.example .env.local   # depois cole o token em TMDB_TOKEN=
   ```

4. Rode o site e os testes:

   ```bash
   npm run dev    # http://localhost:3000
   npm test       # testes automatizados
   ```

## Publicando na Vercel

1. Envie o repositório para o GitHub.
2. Na Vercel, clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione `TMDB_TOKEN` com o seu token.
4. Clique em **Deploy**. A cada `git push` o site é publicado de novo.

## Próximas fases

- **Fase 2:** login com Supabase, favoritos na conta, avaliações e comentários
- **Fase 3:** app mobile

## Créditos

<img src="public/tmdb-logo.svg" alt="TMDB" width="140" />

This product uses the TMDB API but is not endorsed or certified by TMDB.

Dados de disponibilidade nas plataformas: [JustWatch](https://www.justwatch.com).
