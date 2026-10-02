import { CLASSES_GRADE } from "./GradeFilmes";

export default function EsqueletoGrade({ quantidade = 12 }: { quantidade?: number }) {
  return (
    <ul className={CLASSES_GRADE} aria-busy="true" aria-label="Carregando filmes">
      {Array.from({ length: quantidade }, (_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-superficie" />
          <div className="mt-2 h-4 w-3/4 rounded bg-superficie" />
          <div className="mt-1 h-3 w-1/3 rounded bg-superficie" />
        </li>
      ))}
    </ul>
  );
}
