export default function Trailer({ chave, titulo }: { chave: string | null; titulo: string }) {
  if (!chave) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Trailer</h2>
      <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg bg-superficie">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${chave}`}
          title={`Trailer de ${titulo}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
