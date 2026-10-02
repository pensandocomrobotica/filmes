import Link from "next/link";

export default function FilmeNaoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-lg">Filme não encontrado</p>
      <Link href="/" className="rounded-full bg-destaque px-5 py-2 font-medium text-background hover:opacity-90">
        Voltar ao catálogo
      </Link>
    </div>
  );
}
