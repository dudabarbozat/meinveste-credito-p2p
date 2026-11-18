import type { Metadata } from "next";
import { Carteira } from "./Carteira";

export const metadata: Metadata = { title: "Minha carteira" };

export default function Page() {
  return <Carteira />;
}
