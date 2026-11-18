import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/ui";
import { Investir } from "./Investir";

export const metadata: Metadata = { title: "Investir" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando texto="Carregando" />}>
      <Investir />
    </Suspense>
  );
}
