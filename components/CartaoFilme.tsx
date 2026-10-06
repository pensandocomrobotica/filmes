import Image from "next/image";
import Link from "next/link";
import { formatarNota } from "@/lib/formatar";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { Filme } from "@/lib/tmdb/tipos";

export default function CartaoFilme({ filme }: { filme: Filme }) {
  return (
    <Link href={`/filme/${filme.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-superficie">
        <Image
          src={urlImagem(filme.poster, "w342") ?? "/sem-poster.svg"}
          alt={`Pôster de ${filme.titulo}`}
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-destaque">{filme.titulo}</h3>
      <p className="text-xs text-apagado">
        <span className="text-destaque">★</span> {formatarNota(filme.nota)}
        {filme.ano && <span> · {filme.ano}</span>}
      </p>
    </Link>
  );
}
