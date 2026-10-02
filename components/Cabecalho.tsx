import Link from "next/link";

export default function Cabecalho() {
  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          🎬 <span className="hidden sm:inline">Catálogo de Filmes</span>
        </Link>

        {/* Formulário comum: funciona até sem JavaScript, levando a /busca?q=... */}
        <form action="/busca" role="search" className="flex-1">
          <label htmlFor="busca" className="sr-only">
            Buscar filme
          </label>
          <input
            id="busca"
            name="q"
            type="search"
            placeholder="🔍 Buscar filme..."
            className="w-full rounded-full border border-borda bg-superficie px-4 py-2 text-sm outline-none placeholder:text-apagado focus:border-destaque"
          />
        </form>

        <Link
          href="/favoritos"
          aria-label="Meus favoritos"
          title="Meus favoritos"
          className="shrink-0 text-2xl text-destaque hover:scale-110"
        >
          ☆
        </Link>
      </div>
    </header>
  );
}
