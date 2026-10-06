import type { Metadata } from "next";
import ListasFavoritos from "@/components/ListasFavoritos";

export const metadata: Metadata = { title: "Meus favoritos" };

export default function Favoritos() {
  return <ListasFavoritos />;
}
