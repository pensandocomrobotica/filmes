import GradeFilmes from "@/components/GradeFilmes";
import type { Filme } from "@/lib/tmdb/tipos";

// Página temporária: substituída pelo catálogo real na próxima tarefa.
const exemplos: Filme[] = [
  { id: 603, titulo: "Matrix", poster: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", nota: 8.2, ano: 1999 },
  { id: 1, titulo: "Filme sem pôster", poster: null, nota: 6.5, ano: 2020 },
  { id: 2, titulo: "Filme sem nota", poster: null, nota: null, ano: null },
];

export default function Inicio() {
  return <GradeFilmes filmes={exemplos} />;
}
