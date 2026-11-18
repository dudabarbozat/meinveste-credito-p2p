import type { Metadata } from "next";
import { Cadastro } from "./Cadastro";

export const metadata: Metadata = { title: "Sou MEI" };

export default function Page() {
  return <Cadastro />;
}
