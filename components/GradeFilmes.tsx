import CartaoFilme from "./CartaoFilme";
import type { Filme } from "@/lib/tmdb/tipos";

export const CLASSES_GRADE = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export default function GradeFilmes({ filmes }: { filmes: Filme[] }) {
  return (
    <ul className={CLASSES_GRADE}>
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoFilme filme={filme} />
        </li>
      ))}
    </ul>
  );
}
