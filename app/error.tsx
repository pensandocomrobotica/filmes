"use client";

import { useEffect } from "react";

export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-lg">Não conseguimos carregar os filmes agora</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-destaque px-5 py-2 font-medium text-background hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
