import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/ui";
import { Negocio } from "./Negocio";

export const metadata: Metadata = { title: "Negócio" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando texto="Carregando negócio" />}>
      <Negocio />
    </Suspense>
  );
}
