import type { Metadata } from "next";
import { Simulador } from "./Simulador";

export const metadata: Metadata = { title: "Simulador de crédito" };

export default function Page() {
  return <Simulador />;
}
