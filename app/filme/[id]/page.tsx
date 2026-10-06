import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import BotaoFavorito from "@/components/BotaoFavorito";
import Elenco from "@/components/Elenco";
import OndeAssistir from "@/components/OndeAssistir";
import Trailer from "@/components/Trailer";
import { formatarDuracao, formatarNota } from "@/lib/formatar";
import { detalhesDoFilme } from "@/lib/tmdb/filmes";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { Filme } from "@/lib/tmdb/tipos";

export async function generateMetadata({ params }: PageProps<"/filme/[id]">): Promise<Metadata> {
  const filme = await detalhesDoFilme(Number((await params).id));
  return { title: filme?.titulo ?? "Filme não encontrado" };
}

export default async function PaginaFilme({ params }: PageProps<"/filme/[id]">) {
  const filme = await detalhesDoFilme(Number((await params).id));
  if (!filme) notFound();

  const resumo: Filme = { id: filme.id, titulo: filme.titulo, poster: filme.poster, nota: filme.nota, ano: filme.ano };
  const fundo = urlImagem(filme.fundo, "w1280");
  const informacoes = [
    filme.ano,
    formatarDuracao(filme.duracao),
    filme.generos.map((g) => g.nome).join(", "),
  ].filter(Boolean);

  return (
    <article className="space-y-10">
      <header className="relative -mx-4 -mt-6 overflow-hidden px-4 pb-6 pt-10">
        {fundo && (
          <Image src={fundo} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-25" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="relative aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-lg bg-superficie sm:w-56">
            <Image
              src={urlImagem(filme.poster, "w500") ?? "/sem-poster.svg"}
              alt={`Pôster de ${filme.titulo}`}
              fill
              priority
              sizes="224px"
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold sm:text-4xl">{filme.titulo}</h1>
            <p className="text-apagado">{informacoes.join(" · ")}</p>
            <p className="text-lg">
              <span className="text-destaque">★</span> {formatarNota(filme.nota)}
            </p>
            <div className="flex flex-wrap gap-3">
              <BotaoFavorito filme={resumo} lista="favoritos" rotulo="Favorito" />
              <BotaoFavorito filme={resumo} lista="quero-assistir" rotulo="Quero assistir" />
            </div>
          </div>
        </div>
      </header>

      <OndeAssistir dados={filme.ondeAssistir} />

      <section>
        <h2 className="mb-3 text-xl font-semibold">Sinopse</h2>
        <p className="max-w-3xl leading-relaxed text-foreground/90">{filme.sinopse || "Sinopse indisponível."}</p>
      </section>

      <Trailer chave={filme.trailerYoutube} titulo={filme.titulo} />
      <Elenco pessoas={filme.elenco} />
    </article>
  );
}
