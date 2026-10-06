import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
    // O TMDB já entrega as imagens nos tamanhos certos, e o plano gratuito
    // da Vercel limita a quantidade de otimizações de imagem.
    unoptimized: true,
  },
};

export default nextConfig;
