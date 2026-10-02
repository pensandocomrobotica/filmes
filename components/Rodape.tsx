import Image from "next/image";

export default function Rodape() {
  return (
    <footer className="mt-12 border-t border-borda">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center text-xs text-apagado sm:flex-row sm:text-left">
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="shrink-0">
          <Image src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={120} height={16} />
        </a>
        <div className="space-y-1">
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          <p>
            Dados de disponibilidade:{" "}
            <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline">
              JustWatch
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
