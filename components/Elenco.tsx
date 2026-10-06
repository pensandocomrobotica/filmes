import Image from "next/image";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { PessoaElenco } from "@/lib/tmdb/tipos";

export default function Elenco({ pessoas }: { pessoas: PessoaElenco[] }) {
  if (pessoas.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Elenco principal</h2>
      <ul className="flex gap-4 overflow-x-auto pb-2">
        {pessoas.map((p) => (
          <li key={p.id} className="w-28 shrink-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-superficie">
              <Image
                src={urlImagem(p.foto, "w185") ?? "/sem-poster.svg"}
                alt={p.nome}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-sm font-medium leading-tight">{p.nome}</p>
            <p className="text-xs text-apagado">{p.personagem}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
