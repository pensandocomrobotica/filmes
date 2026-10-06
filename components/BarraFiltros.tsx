"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { filtrosParaQuery } from "@/lib/filtros";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { Filtros, Genero, Ordem, Plataforma } from "@/lib/tmdb/tipos";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "populares", rotulo: "Mais populares" },
  { valor: "avaliados", rotulo: "Mais bem avaliados" },
  { valor: "recentes", rotulo: "Mais recentes" },
];

type Props = { plataformas: Plataforma[]; generos: Genero[]; filtros: Filtros };

export default function BarraFiltros({ plataformas, generos, filtros }: Props) {
  const router = useRouter();

  function aplicar(novos: Filtros) {
    const query = filtrosParaQuery(novos);
    router.push(query ? `/?${query}` : "/", { scroll: false });
  }

  function alternarPlataforma(id: number) {
    const selecionadas = filtros.plataformas.includes(id)
      ? filtros.plataformas.filter((p) => p !== id)
      : [...filtros.plataformas, id];
    aplicar({ ...filtros, plataformas: selecionadas });
  }

  const classeSelect =
    "rounded-full border border-borda bg-superficie px-3 py-1.5 text-sm outline-none focus:border-destaque";

  return (
    <section aria-label="Filtros" className="mb-6 space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-sm text-apagado">Plataformas:</span>
        {plataformas.map((p) => {
          const ativa = filtros.plataformas.includes(p.id);
          const logo = urlImagem(p.logo, "w92");
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => alternarPlataforma(p.id)}
              aria-pressed={ativa}
              title={p.nome}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${
                ativa ? "border-destaque bg-destaque/15 text-foreground" : "border-borda text-apagado hover:border-apagado"
              }`}
            >
              {logo && <Image src={logo} alt="" width={24} height={24} className="rounded-full" />}
              {p.nome}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-apagado">
          Gênero:
          <select
            className={classeSelect}
            value={filtros.genero ?? ""}
            onChange={(e) => aplicar({ ...filtros, genero: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Todos os gêneros</option>
            {generos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-apagado">
          Ordenar:
          <select
            className={classeSelect}
            value={filtros.ordem}
            onChange={(e) => aplicar({ ...filtros, ordem: e.target.value as Ordem })}
          >
            {ORDENS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
