import Image from "next/image";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { OndeAssistir as Dados, Plataforma } from "@/lib/tmdb/tipos";

function Grupo({ titulo, plataformas, link }: { titulo: string; plataformas: Plataforma[]; link: string | null }) {
  if (plataformas.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm text-apagado">{titulo}</h3>
      <ul className="flex flex-wrap gap-2">
        {plataformas.map((p) => {
          const logo = urlImagem(p.logo, "w92");
          const conteudo = logo ? (
            <Image src={logo} alt={p.nome} title={p.nome} width={48} height={48} className="rounded-lg" />
          ) : (
            <span className="block rounded-lg bg-superficie px-3 py-3 text-xs">{p.nome}</span>
          );
          return (
            <li key={p.id}>
              {link ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {conteudo}
                </a>
              ) : (
                conteudo
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function OndeAssistir({ dados }: { dados: Dados }) {
  const vazio = !dados.assinatura.length && !dados.aluguel.length && !dados.compra.length;

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Onde assistir</h2>
      {vazio ? (
        <p className="text-apagado">Não disponível em streaming no Brasil no momento</p>
      ) : (
        <div className="flex flex-wrap gap-6">
          <Grupo titulo="Assinatura" plataformas={dados.assinatura} link={dados.link} />
          <Grupo titulo="Aluguel" plataformas={dados.aluguel} link={dados.link} />
          <Grupo titulo="Compra" plataformas={dados.compra} link={dados.link} />
        </div>
      )}
    </section>
  );
}
